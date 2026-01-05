-- Add new task categories by updating the check constraint

-- Drop existing check constraint
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_category_check;

-- Add new check constraint with updated categories
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_category_check 
CHECK (category IN ('vendor_ops', 'rider_fleet', 'customer_service', 'business_development', 'dashboard_support'));
