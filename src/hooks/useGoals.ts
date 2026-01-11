import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface KeyResult {
    id: string;
    goal_id: string;
    title: string;
    current_value: number;
    target_value: number;
    unit: string;
    created_at: string;
    updated_at: string;
}

export interface Goal {
    id: string;
    title: string;
    description: string | null;
    owner_id: string;
    target_date: string | null;
    progress: number;
    status: 'active' | 'completed' | 'archived';
    created_at: string;
    updated_at: string;
    // Joined data
    owner_name?: string;
    key_results?: KeyResult[];
}

export interface GoalInput {
    title: string;
    description?: string;
    target_date?: string;
}

export interface KeyResultInput {
    title: string;
    target_value: number;
    unit?: string;
}

export function useGoals() {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGoals = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('goals')
                .select(`
          *,
          profiles:owner_id (full_name),
          key_results (*)
        `)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            const transformedGoals: Goal[] = (data || []).map((g: Record<string, unknown>) => ({
                id: g.id as string,
                title: g.title as string,
                description: g.description as string | null,
                owner_id: g.owner_id as string,
                target_date: g.target_date as string | null,
                progress: Number(g.progress) || 0,
                status: g.status as 'active' | 'completed' | 'archived',
                created_at: g.created_at as string,
                updated_at: g.updated_at as string,
                owner_name: (g.profiles as Record<string, unknown>)?.full_name as string,
                key_results: g.key_results as KeyResult[],
            }));

            setGoals(transformedGoals);
        } catch (err) {
            console.error('Error fetching goals:', err);
            setError('Failed to load goals');
        } finally {
            setLoading(false);
        }
    }, []);

    const createGoal = async (input: GoalInput): Promise<{ success: boolean; error?: string; data?: Goal }> => {
        if (!user) return { success: false, error: 'Not authenticated' };

        try {
            const { data, error: insertError } = await supabase
                .from('goals')
                .insert({
                    title: input.title,
                    description: input.description || null,
                    target_date: input.target_date || null,
                    owner_id: user.id,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            await fetchGoals();
            return { success: true, data };
        } catch (err) {
            console.error('Error creating goal:', err);
            return { success: false, error: 'Failed to create goal' };
        }
    };

    const updateGoal = async (id: string, updates: Partial<GoalInput> & { status?: Goal['status'] }): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: updateError } = await supabase
                .from('goals')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchGoals();
            return { success: true };
        } catch (err) {
            console.error('Error updating goal:', err);
            return { success: false, error: 'Failed to update goal' };
        }
    };

    const deleteGoal = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: deleteError } = await supabase
                .from('goals')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchGoals();
            return { success: true };
        } catch (err) {
            console.error('Error deleting goal:', err);
            return { success: false, error: 'Failed to delete goal' };
        }
    };

    const addKeyResult = async (goalId: string, input: KeyResultInput): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: insertError } = await supabase
                .from('key_results')
                .insert({
                    goal_id: goalId,
                    title: input.title,
                    target_value: input.target_value,
                    unit: input.unit || '%',
                });

            if (insertError) throw insertError;

            await fetchGoals();
            return { success: true };
        } catch (err) {
            console.error('Error adding key result:', err);
            return { success: false, error: 'Failed to add key result' };
        }
    };

    const updateKeyResult = async (id: string, updates: Partial<KeyResultInput> & { current_value?: number }): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: updateError } = await supabase
                .from('key_results')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchGoals();
            return { success: true };
        } catch (err) {
            console.error('Error updating key result:', err);
            return { success: false, error: 'Failed to update key result' };
        }
    };

    const deleteKeyResult = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: deleteError } = await supabase
                .from('key_results')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            await fetchGoals();
            return { success: true };
        } catch (err) {
            console.error('Error deleting key result:', err);
            return { success: false, error: 'Failed to delete key result' };
        }
    };

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    return {
        goals,
        loading,
        error,
        createGoal,
        updateGoal,
        deleteGoal,
        addKeyResult,
        updateKeyResult,
        deleteKeyResult,
        refetch: fetchGoals,
        currentUserId: user?.id,
    };
}
