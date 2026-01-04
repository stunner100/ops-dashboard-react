-- Direct Messages tables for 1:1 private conversations
-- Creates dm_conversations and direct_messages tables

-- DM Conversations table - tracks unique user pairs
CREATE TABLE IF NOT EXISTS public.dm_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure user1_id < user2_id to avoid duplicate conversations
    CONSTRAINT dm_unique_pair UNIQUE (user1_id, user2_id),
    CONSTRAINT dm_different_users CHECK (user1_id <> user2_id)
);

-- Direct Messages table - stores actual messages
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user1 ON public.dm_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user2 ON public.dm_conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message ON public.dm_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dm_conversations
-- Users can only see conversations they are part of
CREATE POLICY "users_read_own_conversations" 
    ON public.dm_conversations 
    FOR SELECT 
    TO authenticated 
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "users_create_conversations" 
    ON public.dm_conversations 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "users_update_own_conversations" 
    ON public.dm_conversations 
    FOR UPDATE 
    TO authenticated 
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- RLS Policies for direct_messages
-- Users can only see messages in their conversations
CREATE POLICY "users_read_dm_messages" 
    ON public.direct_messages 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.dm_conversations dc
            WHERE dc.id = conversation_id
            AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
        )
    );

CREATE POLICY "users_send_dm_messages" 
    ON public.direct_messages 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.dm_conversations dc
            WHERE dc.id = conversation_id
            AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
        )
    );

CREATE POLICY "users_update_dm_messages" 
    ON public.direct_messages 
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.dm_conversations dc
            WHERE dc.id = conversation_id
            AND (dc.user1_id = auth.uid() OR dc.user2_id = auth.uid())
        )
    );

-- Enable real-time for DM updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Function to get or create a DM conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_dm_conversation(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    current_user_id UUID := auth.uid();
    conversation_id UUID;
    sorted_user1 UUID;
    sorted_user2 UUID;
BEGIN
    -- Sort user IDs to ensure consistent ordering
    IF current_user_id < other_user_id THEN
        sorted_user1 := current_user_id;
        sorted_user2 := other_user_id;
    ELSE
        sorted_user1 := other_user_id;
        sorted_user2 := current_user_id;
    END IF;
    
    -- Try to find existing conversation
    SELECT id INTO conversation_id
    FROM public.dm_conversations
    WHERE user1_id = sorted_user1 AND user2_id = sorted_user2;
    
    -- Create if doesn't exist
    IF conversation_id IS NULL THEN
        INSERT INTO public.dm_conversations (user1_id, user2_id)
        VALUES (sorted_user1, sorted_user2)
        RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_message_at when a new message is sent
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.dm_conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON public.direct_messages;
CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON public.direct_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();
