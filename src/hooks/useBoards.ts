import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Board {
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string;
    owner_id: string;
    is_shared: boolean;
    created_at: string;
    updated_at: string;
}

export interface BoardInput {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    is_shared?: boolean;
}

export function useBoards() {
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // Fetch all boards for the current user
    const fetchBoards = useCallback(async () => {
        if (!user) {
            setBoards([]);
            setLoading(false);
            return [];
        }

        try {
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('boards')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setBoards(data || []);
            setError(null);
            return data || [];
        } catch (err) {
            console.error('Error fetching boards:', err);
            setError('Failed to fetch boards');
            return [];
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Create a new board
    const createBoard = async (input: BoardInput): Promise<{ success: boolean; error?: string; data?: Board }> => {
        if (!user) return { success: false, error: 'Not authenticated' };

        try {
            const newBoard = {
                ...input,
                owner_id: user.id,
                color: input.color || '#3B82F6',
                icon: input.icon || 'folder',
            };

            const { data, error: createError } = await supabase
                .from('boards')
                .insert(newBoard)
                .select()
                .single();

            if (createError) throw createError;

            // Optimistically update local state
            setBoards((prev) => [data, ...prev]);

            return { success: true, data };
        } catch (err) {
            console.error('Error creating board:', err);
            return { success: false, error: 'Failed to create board' };
        }
    };

    // Update an existing board
    const updateBoard = async (id: string, updates: Partial<BoardInput>): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data, error: updateError } = await supabase
                .from('boards')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Update local state
            setBoards((prev) => prev.map((b) => (b.id === id ? data : b)));

            return { success: true };
        } catch (err) {
            console.error('Error updating board:', err);
            return { success: false, error: 'Failed to update board' };
        }
    };

    // Delete a board
    const deleteBoard = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: deleteError } = await supabase
                .from('boards')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Remove from local state
            setBoards((prev) => prev.filter((b) => b.id !== id));

            return { success: true };
        } catch (err) {
            console.error('Error deleting board:', err);
            return { success: false, error: 'Failed to delete board' };
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchBoards();
    }, [fetchBoards]);

    // Real-time subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('boards-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'boards',
                    filter: `owner_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setBoards((prev) => {
                            if (prev.find((b) => b.id === payload.new.id)) return prev;
                            return [payload.new as Board, ...prev];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setBoards((prev) =>
                            prev.map((b) => (b.id === payload.new.id ? (payload.new as Board) : b))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setBoards((prev) => prev.filter((b) => b.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return {
        boards,
        loading,
        error,
        fetchBoards,
        createBoard,
        updateBoard,
        deleteBoard,
    };
}
