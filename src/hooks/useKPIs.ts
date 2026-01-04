import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export type KPICategory = 'overview' | 'vendor_ops' | 'rider_fleet' | 'customer_service';

export interface KPI {
    id: string;
    name: string;
    value: string;
    previous_value?: string | null;
    category: KPICategory;
    icon?: string | null;
    display_order: number;
    updated_at: string;
    updated_by?: string | null;
}

export interface KPIsByCategory {
    overview: KPI[];
    vendor_ops: KPI[];
    rider_fleet: KPI[];
    customer_service: KPI[];
}

// Calculate percent change between current and previous value
export function calculateChange(current: string, previous?: string | null): { change: string; trend: 'up' | 'down' } {
    if (!previous) return { change: '', trend: 'up' };

    // Extract numeric values
    const currentNum = parseFloat(current.replace(/[^0-9.-]/g, ''));
    const previousNum = parseFloat(previous.replace(/[^0-9.-]/g, ''));

    if (isNaN(currentNum) || isNaN(previousNum) || previousNum === 0) {
        return { change: '', trend: 'up' };
    }

    const percentChange = ((currentNum - previousNum) / Math.abs(previousNum)) * 100;
    const trend = percentChange >= 0 ? 'up' : 'down';

    // For delivery time, down is better
    if (current.includes('min') && percentChange < 0) {
        return { change: `${Math.abs(percentChange).toFixed(0)}%`, trend: 'up' };
    }

    return {
        change: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(0)}%`,
        trend,
    };
}

export function useKPIs() {
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // Fetch all KPIs
    const fetchKPIs = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('kpis')
                .select('*')
                .order('display_order', { ascending: true });

            if (fetchError) throw fetchError;
            setKpis(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching KPIs:', err);
            setError('Failed to fetch KPIs');
        } finally {
            setLoading(false);
        }
    }, []);

    // Update a KPI value
    const updateKPI = useCallback(async (
        id: string,
        newValue: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            // Get current value to set as previous
            const currentKPI = kpis.find(k => k.id === id);

            const { data, error: updateError } = await supabase
                .from('kpis')
                .update({
                    value: newValue,
                    previous_value: currentKPI?.value,
                    updated_by: user?.id
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Optimistically update local state
            setKpis(prev => prev.map(k => k.id === id ? data : k));
            return { success: true };
        } catch (err) {
            console.error('Error updating KPI:', err);
            return { success: false, error: 'Failed to update KPI' };
        }
    }, [kpis, user]);

    // Create a new KPI
    const createKPI = useCallback(async (
        name: string,
        value: string,
        category: KPICategory,
        icon?: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            // Get max display_order for this category
            const categoryKpis = kpis.filter(k => k.category === category);
            const maxOrder = categoryKpis.length > 0
                ? Math.max(...categoryKpis.map(k => k.display_order))
                : 0;

            const { data, error: createError } = await supabase
                .from('kpis')
                .insert({
                    name,
                    value,
                    category,
                    icon: icon || null,
                    display_order: maxOrder + 1,
                    updated_by: user?.id
                })
                .select()
                .single();

            if (createError) throw createError;

            // Optimistically update local state
            setKpis(prev => [...prev, data].sort((a, b) => a.display_order - b.display_order));
            return { success: true };
        } catch (err) {
            console.error('Error creating KPI:', err);
            return { success: false, error: 'Failed to create KPI' };
        }
    }, [kpis, user]);

    // Delete a KPI
    const deleteKPI = useCallback(async (
        id: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: deleteError } = await supabase
                .from('kpis')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Optimistically update local state
            setKpis(prev => prev.filter(k => k.id !== id));
            return { success: true };
        } catch (err) {
            console.error('Error deleting KPI:', err);
            return { success: false, error: 'Failed to delete KPI' };
        }
    }, []);

    // Get KPIs organized by category
    const kpisByCategory: KPIsByCategory = {
        overview: kpis.filter(k => k.category === 'overview'),
        vendor_ops: kpis.filter(k => k.category === 'vendor_ops'),
        rider_fleet: kpis.filter(k => k.category === 'rider_fleet'),
        customer_service: kpis.filter(k => k.category === 'customer_service'),
    };

    // Initial fetch
    useEffect(() => {
        fetchKPIs();
    }, [fetchKPIs]);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('kpis-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'kpis',
                },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setKpis(prev =>
                            prev.map(k => k.id === payload.new.id ? (payload.new as KPI) : k)
                        );
                    } else if (payload.eventType === 'INSERT') {
                        setKpis(prev => {
                            if (prev.find(k => k.id === payload.new.id)) return prev;
                            return [...prev, payload.new as KPI].sort((a, b) => a.display_order - b.display_order);
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setKpis(prev => prev.filter(k => k.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        kpis,
        kpisByCategory,
        loading,
        error,
        createKPI,
        updateKPI,
        deleteKPI,
        refetch: fetchKPIs,
    };
}
