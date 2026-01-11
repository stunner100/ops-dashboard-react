-- Recurring Tasks Auto-Generation Function
-- This function finds recurring tasks and creates new instances when due

-- Function to calculate the next due date based on recurrence pattern
CREATE OR REPLACE FUNCTION public.calculate_next_due_date(
    current_due DATE,
    pattern TEXT,
    interval_value INTEGER
) RETURNS DATE AS $$
BEGIN
    CASE pattern
        WHEN 'daily' THEN
            RETURN current_due + (interval_value || ' days')::INTERVAL;
        WHEN 'weekly' THEN
            RETURN current_due + (interval_value * 7 || ' days')::INTERVAL;
        WHEN 'monthly' THEN
            RETURN current_due + (interval_value || ' months')::INTERVAL;
        WHEN 'yearly' THEN
            RETURN current_due + (interval_value || ' years')::INTERVAL;
        ELSE
            RETURN current_due + (interval_value || ' days')::INTERVAL;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main function to generate recurring task instances
CREATE OR REPLACE FUNCTION public.generate_recurring_tasks()
RETURNS TABLE (
    created_task_id UUID,
    parent_task_id UUID,
    new_due_date DATE
) AS $$
DECLARE
    rec RECORD;
    new_task_id UUID;
    next_due DATE;
BEGIN
    -- Find all recurring tasks that need a new instance generated
    -- Conditions:
    -- 1. Task is a recurring template (is_recurring = true, parent_task_id IS NULL)
    -- 2. Has a due date that has passed or is today
    -- 3. No existing pending/in-progress child task exists for the next occurrence
    -- 4. Recurrence end date not exceeded
    FOR rec IN 
        SELECT t.*
        FROM public.tasks t
        WHERE t.is_recurring = true
          AND t.parent_task_id IS NULL  -- Only templates, not instances
          AND t.due_date IS NOT NULL
          AND t.due_date <= CURRENT_DATE
          AND t.status != 'completed'  -- Template should be active
          AND (t.recurrence_end_date IS NULL OR t.recurrence_end_date >= CURRENT_DATE)
          -- Check no pending instance exists for next due date
          AND NOT EXISTS (
              SELECT 1 FROM public.tasks child
              WHERE child.parent_task_id = t.id
                AND child.status IN ('pending', 'in-progress', 'urgent')
          )
    LOOP
        -- Calculate next due date
        next_due := public.calculate_next_due_date(
            rec.due_date,
            rec.recurrence_pattern,
            COALESCE(rec.recurrence_interval, 1)
        );
        
        -- Skip if next due date exceeds end date
        IF rec.recurrence_end_date IS NOT NULL AND next_due > rec.recurrence_end_date THEN
            CONTINUE;
        END IF;
        
        -- Create new task instance
        INSERT INTO public.tasks (
            title,
            description,
            category,
            status,
            priority,
            start_date,
            due_date,
            assignee_id,
            assignee_name,
            assignee_ids,
            assignee_names,
            is_recurring,
            recurrence_pattern,
            recurrence_interval,
            recurrence_end_date,
            parent_task_id,
            board_id,
            created_by
        ) VALUES (
            rec.title,
            rec.description,
            rec.category,
            'pending',  -- New instance starts as pending
            rec.priority,
            CASE WHEN rec.start_date IS NOT NULL 
                THEN rec.start_date + (next_due - rec.due_date)
                ELSE NULL 
            END,
            next_due,
            rec.assignee_id,
            rec.assignee_name,
            rec.assignee_ids,
            rec.assignee_names,
            false,  -- Instance is NOT a recurring template
            NULL,   -- No recurrence pattern for instances
            NULL,   -- No interval for instances
            NULL,   -- No end date for instances
            rec.id, -- Link to parent/template task
            rec.board_id,
            rec.created_by
        )
        RETURNING id INTO new_task_id;
        
        -- Update the template's due date to the next occurrence
        UPDATE public.tasks 
        SET due_date = next_due
        WHERE id = rec.id;
        
        -- Return the created task info
        created_task_id := new_task_id;
        parent_task_id := rec.id;
        new_due_date := next_due;
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_recurring_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_next_due_date(DATE, TEXT, INTEGER) TO authenticated;

-- Create a helper function to manually trigger recurring task generation
-- This can be called from the frontend or a scheduled job
CREATE OR REPLACE FUNCTION public.check_and_generate_recurring_tasks()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    count INTEGER;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'task_id', created_task_id,
        'parent_id', parent_task_id,
        'due_date', new_due_date
    )), COUNT(*)
    INTO result, count
    FROM public.generate_recurring_tasks();
    
    RETURN jsonb_build_object(
        'success', true,
        'generated_count', COALESCE(count, 0),
        'tasks', COALESCE(result, '[]'::JSONB)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_and_generate_recurring_tasks() TO authenticated;

-- Comment explaining usage
COMMENT ON FUNCTION public.generate_recurring_tasks() IS 
'Generates new task instances for recurring tasks whose due date has passed. 
Call this function daily via cron or Edge Function. 
Returns list of newly created task IDs.';

COMMENT ON FUNCTION public.check_and_generate_recurring_tasks() IS
'Wrapper function that generates recurring tasks and returns a JSON summary.
Can be called from frontend: supabase.rpc("check_and_generate_recurring_tasks")';
