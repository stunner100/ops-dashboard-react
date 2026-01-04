-- Create tasks table for the Overview board
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('vendor_ops', 'rider_fleet', 'customer_service')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'urgent', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    due_date DATE,
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assignee_name TEXT, -- Denormalized for quick display
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All authenticated users can read all tasks
CREATE POLICY "Authenticated users can read all tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can create tasks
CREATE POLICY "Authenticated users can create tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Authenticated users can update any task
CREATE POLICY "Authenticated users can update tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Only task creator can delete
CREATE POLICY "Task creators can delete their tasks"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_task_updated_at ON public.tasks;
CREATE TRIGGER trigger_update_task_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_task_updated_at();

-- Seed some initial tasks for testing
INSERT INTO public.tasks (title, description, category, status, priority, due_date, assignee_name)
VALUES 
    ('Review vendor applications', 'Process pending vendor applications from last week', 'vendor_ops', 'in-progress', 'high', CURRENT_DATE + INTERVAL '2 days', 'John D.'),
    ('Onboard new delivery partners', 'Complete onboarding for 5 new riders', 'rider_fleet', 'pending', 'medium', CURRENT_DATE + INTERVAL '3 days', 'Sarah M.'),
    ('Resolve customer complaints', 'Address urgent customer issues from support queue', 'customer_service', 'urgent', 'critical', CURRENT_DATE, 'Mike R.'),
    ('Update menu pricing', 'Sync vendor menu prices with latest updates', 'vendor_ops', 'completed', 'low', CURRENT_DATE - INTERVAL '3 days', 'Lisa K.'),
    ('Fleet maintenance check', 'Schedule maintenance for delivery vehicles', 'rider_fleet', 'in-progress', 'medium', CURRENT_DATE + INTERVAL '5 days', 'Tom W.'),
    ('Training session prep', 'Prepare materials for customer service training', 'customer_service', 'pending', 'low', CURRENT_DATE + INTERVAL '7 days', 'Emma S.')
ON CONFLICT DO NOTHING;

-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
