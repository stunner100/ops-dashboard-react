-- Create task_comments table for threaded discussions on tasks
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent ON public.task_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author ON public.task_comments(author_id);

-- Enable RLS on task_comments table
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_comments
-- Authenticated users can view comments on tasks they can access
CREATE POLICY "Users can view comments" ON public.task_comments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can create comments
CREATE POLICY "Users can create comments" ON public.task_comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON public.task_comments
    FOR UPDATE USING (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.task_comments
    FOR DELETE USING (auth.uid() = author_id);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment" ON public.task_comments
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Create trigger to update updated_at on update
CREATE OR REPLACE FUNCTION update_task_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_comment_updated_at
    BEFORE UPDATE ON public.task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_task_comment_updated_at();
