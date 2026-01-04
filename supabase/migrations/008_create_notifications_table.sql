-- Notifications table for Inbox functionality
-- Stores user-targeted notifications with priority levels and read status

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('alert', 'message', 'update', 'system')),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own notifications
CREATE POLICY "users_read_own_notifications" 
    ON public.notifications 
    FOR SELECT 
    TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "users_update_own_notifications" 
    ON public.notifications 
    FOR UPDATE 
    TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "users_delete_own_notifications" 
    ON public.notifications 
    FOR DELETE 
    TO authenticated 
    USING (user_id = auth.uid());

-- Allow system/service role to insert notifications for any user
CREATE POLICY "service_insert_notifications" 
    ON public.notifications 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Enable real-time for live notification updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
