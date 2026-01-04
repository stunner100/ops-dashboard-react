import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkjluyiljdddpyxcdjed.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpramx1eWlsamRkZHB5eGNkamVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NjQ4NzksImV4cCI6MjA4MjQ0MDg3OX0.p08vOLpSpYqr4SvhFdMvJbspYq-_uO4JiqUqGVvRRjY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};
