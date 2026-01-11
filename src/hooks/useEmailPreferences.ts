import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface EmailPreferences {
    id?: string;
    user_id?: string;
    task_assigned: boolean;
    task_due_soon: boolean;
    task_completed: boolean;
    task_comment: boolean;
    daily_digest: boolean;
    weekly_summary: boolean;
}

const defaultPreferences: EmailPreferences = {
    task_assigned: true,
    task_due_soon: true,
    task_completed: false,
    task_comment: true,
    daily_digest: false,
    weekly_summary: true,
};

export function useEmailPreferences() {
    const [preferences, setPreferences] = useState<EmailPreferences>(defaultPreferences);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // Fetch preferences
    const fetchPreferences = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('email_preferences')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    // No record found, create default
                    const { data: newData, error: insertError } = await supabase
                        .from('email_preferences')
                        .insert({ user_id: user.id, ...defaultPreferences })
                        .select()
                        .single();

                    if (insertError) throw insertError;
                    setPreferences(newData || defaultPreferences);
                } else {
                    throw fetchError;
                }
            } else {
                setPreferences(data || defaultPreferences);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching email preferences:', err);
            setError('Failed to load preferences');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Update preferences
    const updatePreferences = async (updates: Partial<EmailPreferences>): Promise<boolean> => {
        if (!user?.id) return false;

        try {
            setSaving(true);
            const { data, error: updateError } = await supabase
                .from('email_preferences')
                .upsert({
                    user_id: user.id,
                    ...preferences,
                    ...updates
                }, { onConflict: 'user_id' })
                .select()
                .single();

            if (updateError) throw updateError;
            setPreferences(data);
            return true;
        } catch (err) {
            console.error('Error updating email preferences:', err);
            setError('Failed to save preferences');
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Toggle a single preference
    const togglePreference = async (key: keyof EmailPreferences): Promise<boolean> => {
        if (key === 'id' || key === 'user_id') return false;
        const current = preferences[key] as boolean;
        return updatePreferences({ [key]: !current });
    };

    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    return {
        preferences,
        loading,
        saving,
        error,
        updatePreferences,
        togglePreference,
        refetch: fetchPreferences,
    };
}
