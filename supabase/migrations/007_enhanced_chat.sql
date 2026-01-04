-- Enhanced chat tables for @mentions and file uploads

-- Add mentions column to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS mentions JSONB DEFAULT '[]'::jsonb;

-- Add attachment columns to chat_messages
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS attachment_name TEXT;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Create index for mentions
CREATE INDEX IF NOT EXISTS idx_chat_messages_mentions 
ON public.chat_messages USING GIN (mentions);

-- Ensure channel_members table exists for @mentions
CREATE TABLE IF NOT EXISTS public.channel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, user_id)
);

-- Enable RLS on channel_members
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_members" ON public.channel_members 
FOR SELECT TO authenticated USING (true);

CREATE POLICY "join_channels" ON public.channel_members 
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Auto-join users to public channels when they send a message
CREATE OR REPLACE FUNCTION auto_join_channel()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.channel_members (channel_id, user_id)
    VALUES (NEW.channel_id, NEW.sender_id)
    ON CONFLICT (channel_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_join_channel ON public.chat_messages;
CREATE TRIGGER trigger_auto_join_channel
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION auto_join_channel();

-- Create storage bucket for chat files (run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);
