-- Create task_attachments table for file uploads on tasks
CREATE TABLE IF NOT EXISTS public.task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON public.task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON public.task_attachments(uploaded_by);

-- Enable RLS on task_attachments table
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_attachments
-- Authenticated users can view attachments on tasks they can access
CREATE POLICY "Users can view attachments" ON public.task_attachments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can create attachments
CREATE POLICY "Users can create attachments" ON public.task_attachments
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments" ON public.task_attachments
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Admins can delete any attachment
CREATE POLICY "Admins can delete any attachment" ON public.task_attachments
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
