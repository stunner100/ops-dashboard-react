import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type NotificationType = 'alert' | 'message' | 'update' | 'system';
export type NotificationPriority = 'high' | 'medium' | 'low';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    description: string | null;
    priority: NotificationPriority;
    read: boolean;
    link: string | null;
    created_at: string;
}

export function useInbox() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

    /**
     * Calculate unread count
     */
    const unreadCount = notifications.filter((n) => !n.read).length;

    /**
     * Fetch all notifications for the current user
     */
    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setLoading(false);
            return [];
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setNotifications(data || []);
            return data || [];
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to load notifications');
            return [];
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Mark a single notification as read
     */
    const markAsRead = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: updateError } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id);

            if (updateError) throw updateError;

            // Optimistically update local state
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );

            return { success: true };
        } catch (err) {
            console.error('Error marking notification as read:', err);
            return { success: false, error: 'Failed to mark as read' };
        }
    };

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = async (): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Not authenticated' };

        try {
            const { error: updateError } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);

            if (updateError) throw updateError;

            // Optimistically update local state
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

            return { success: true };
        } catch (err) {
            console.error('Error marking all as read:', err);
            return { success: false, error: 'Failed to mark all as read' };
        }
    };

    /**
     * Delete a notification
     */
    const deleteNotification = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: deleteError } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            // Remove from local state
            setNotifications((prev) => prev.filter((n) => n.id !== id));

            return { success: true };
        } catch (err) {
            console.error('Error deleting notification:', err);
            return { success: false, error: 'Failed to delete notification' };
        }
    };

    /**
     * Create a new notification (for task assignments, etc.)
     */
    const createNotification = async (
        userId: string,
        notification: {
            type: NotificationType;
            title: string;
            description?: string;
            priority?: NotificationPriority;
            link?: string;
        }
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error: insertError } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    type: notification.type,
                    title: notification.title,
                    description: notification.description || null,
                    priority: notification.priority || 'medium',
                    link: notification.link || null,
                    read: false,
                });

            if (insertError) throw insertError;
            return { success: true };
        } catch (err) {
            console.error('Error creating notification:', err);
            return { success: false, error: 'Failed to create notification' };
        }
    };


    /**
     * Format timestamp to relative time (e.g., "5 min ago")
     */
    const formatTimestamp = (timestamp: string): string => {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    };

    /**
     * Subscribe to real-time updates
     */
    const subscribeToNotifications = useCallback(() => {
        if (!user) return;

        // Cleanup existing subscription
        if (realtimeChannelRef.current) {
            supabase.removeChannel(realtimeChannelRef.current);
        }

        realtimeChannelRef.current = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setNotifications((prev) => {
                            // Avoid duplicates
                            if (prev.some((n) => n.id === payload.new.id)) return prev;
                            return [payload.new as Notification, ...prev];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications((prev) =>
                            prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
                    }
                }
            )
            .subscribe();
    }, [user]);

    // Initial fetch on mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Setup real-time subscription
    useEffect(() => {
        subscribeToNotifications();

        return () => {
            if (realtimeChannelRef.current) {
                supabase.removeChannel(realtimeChannelRef.current);
            }
        };
    }, [subscribeToNotifications]);

    return {
        notifications,
        loading,
        error,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        createNotification,
        formatTimestamp,
    };
}
