-- Fix: Add avatar_url column to profiles table if it doesn't exist
-- Some Supabase projects may not have this column by default

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
