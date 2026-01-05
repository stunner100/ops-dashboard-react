-- Add marketing_brands role to profiles table constraint

-- Drop existing check constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new check constraint with updated roles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer_service', 'rider_manager', 'vendor_manager', 'business_development_manager', 'dashboard_support', 'marketing_brands', 'admin'));
