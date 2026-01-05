-- Allow admins to delete any task

-- Drop the restrictive delete policy
DROP POLICY IF EXISTS "Task creators can delete their tasks" ON public.tasks;

-- Allow task creators OR admins to delete tasks
CREATE POLICY "Task creators and admins can delete tasks"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (
        auth.uid() = created_by 
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
