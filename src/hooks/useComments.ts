import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Comment {
    id: string;
    task_id: string;
    parent_id: string | null;
    author_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    // Joined data
    author_name?: string;
    author_avatar?: string;
    replies?: Comment[];
}

export interface CommentInput {
    content: string;
    parent_id?: string;
}

export function useComments(taskId: string | null) {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch comments for a task
    const fetchComments = useCallback(async () => {
        if (!taskId) {
            setComments([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('task_comments')
                .select(`
          *,
          profiles:author_id (
            full_name,
            avatar_url
          )
        `)
                .eq('task_id', taskId)
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            // Transform data to include author info
            const transformedComments: Comment[] = (data || []).map((comment: Record<string, unknown>) => ({
                id: comment.id as string,
                task_id: comment.task_id as string,
                parent_id: comment.parent_id as string | null,
                author_id: comment.author_id as string,
                content: comment.content as string,
                created_at: comment.created_at as string,
                updated_at: comment.updated_at as string,
                author_name: (comment.profiles as Record<string, unknown>)?.full_name as string || 'Unknown',
                author_avatar: (comment.profiles as Record<string, unknown>)?.avatar_url as string,
            }));

            // Organize into threads (parent comments with nested replies)
            const parentComments = transformedComments.filter(c => !c.parent_id);
            const replies = transformedComments.filter(c => c.parent_id);

            const threaded = parentComments.map(parent => ({
                ...parent,
                replies: replies.filter(r => r.parent_id === parent.id),
            }));

            setComments(threaded);
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError('Failed to load comments');
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    // Create a new comment
    const createComment = async (input: CommentInput): Promise<{ success: boolean; error?: string }> => {
        if (!user || !taskId) {
            return { success: false, error: 'Not authenticated or no task selected' };
        }

        try {
            const { error: insertError } = await supabase
                .from('task_comments')
                .insert({
                    task_id: taskId,
                    author_id: user.id,
                    content: input.content,
                    parent_id: input.parent_id || null,
                });

            if (insertError) throw insertError;

            // Refresh comments
            await fetchComments();
            return { success: true };
        } catch (err) {
            console.error('Error creating comment:', err);
            return { success: false, error: 'Failed to create comment' };
        }
    };

    // Update a comment
    const updateComment = async (commentId: string, content: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const { error: updateError } = await supabase
                .from('task_comments')
                .update({ content })
                .eq('id', commentId)
                .eq('author_id', user.id); // Only allow updating own comments

            if (updateError) throw updateError;

            await fetchComments();
            return { success: true };
        } catch (err) {
            console.error('Error updating comment:', err);
            return { success: false, error: 'Failed to update comment' };
        }
    };

    // Delete a comment
    const deleteComment = async (commentId: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const { error: deleteError } = await supabase
                .from('task_comments')
                .delete()
                .eq('id', commentId);

            if (deleteError) throw deleteError;

            await fetchComments();
            return { success: true };
        } catch (err) {
            console.error('Error deleting comment:', err);
            return { success: false, error: 'Failed to delete comment' };
        }
    };

    // Set up real-time subscription
    useEffect(() => {
        if (!taskId) return;

        fetchComments();

        // Subscribe to changes
        const channel = supabase
            .channel(`task_comments:${taskId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'task_comments',
                    filter: `task_id=eq.${taskId}`,
                },
                () => {
                    fetchComments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [taskId, fetchComments]);

    return {
        comments,
        loading,
        error,
        createComment,
        updateComment,
        deleteComment,
        currentUserName: profile?.full_name || user?.email || 'You',
        currentUserId: user?.id,
    };
}
