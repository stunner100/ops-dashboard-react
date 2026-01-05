-- Create boards table for personal project management
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'folder',
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add board_id column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES public.boards(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_boards_owner ON public.boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_board ON public.tasks(board_id);

-- Enable RLS on boards table
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
-- Users can view their own boards
CREATE POLICY "Users can view own boards" ON public.boards
    FOR SELECT USING (owner_id = auth.uid());

-- Users can create boards
CREATE POLICY "Users can create boards" ON public.boards
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can update their own boards
CREATE POLICY "Users can update own boards" ON public.boards
    FOR UPDATE USING (owner_id = auth.uid());

-- Users can delete their own boards
CREATE POLICY "Users can delete own boards" ON public.boards
    FOR DELETE USING (owner_id = auth.uid());

-- Admins can see all boards
CREATE POLICY "Admins can view all boards" ON public.boards
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
