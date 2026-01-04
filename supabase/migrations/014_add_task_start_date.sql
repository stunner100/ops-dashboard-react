-- Add start_date column to tasks table for Gantt/Timeline functionality
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_date DATE;

-- Update existing tasks: set start_date based on created_at or due_date
-- If due_date exists, set start_date to 3 days before due_date
-- Otherwise, use the created_at date
UPDATE public.tasks
SET start_date = COALESCE(
    due_date - INTERVAL '3 days',
    created_at::date
)::date
WHERE start_date IS NULL;

-- Create index for start_date queries
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON public.tasks(start_date);
