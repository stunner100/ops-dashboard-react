-- Add multiple assignees and recurring task support

-- Multiple Assignees
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS assignee_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS assignee_names TEXT[] DEFAULT '{}';

-- Recurring Task Fields
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Index for recurring task queries
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON public.tasks(is_recurring) WHERE is_recurring = true;

-- Migrate existing single assignee to array format
UPDATE public.tasks 
SET assignee_ids = ARRAY[assignee_id]::UUID[], 
    assignee_names = ARRAY[assignee_name]::TEXT[]
WHERE assignee_id IS NOT NULL 
  AND (assignee_ids IS NULL OR assignee_ids = '{}');
