-- Chat tables migration for Team Chat functionality
-- Note: Run this if tables don't exist, or use ALTER TABLE commands below if tables already exist

-- Create channels table (if not exists)
CREATE TABLE IF NOT EXISTS public.chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    topic TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table (if not exists)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If tables exist but missing columns, add them:
-- ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE;
-- ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
-- ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
-- ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_avatar TEXT;

-- Enable RLS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "read_channels" ON public.chat_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "create_channels" ON public.chat_channels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "read_messages" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "send_messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (true);

-- Seed default channels
INSERT INTO public.chat_channels (name, topic) VALUES 
    ('general', 'General discussion'),
    ('vendor-ops', 'Vendor operations'),
    ('rider-fleet', 'Rider management'),
    ('customer-service', 'Customer service')
ON CONFLICT (name) DO NOTHING;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
