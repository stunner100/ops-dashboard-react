-- Add 'dashboard_support' to the allowed roles in profiles table

-- First, drop the existing check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new check constraint with dashboard_support included
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer_service', 'rider_manager', 'vendor_manager', 'business_development_manager', 'dashboard_support', 'admin'));
