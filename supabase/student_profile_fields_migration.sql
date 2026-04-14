-- Run this in the Supabase SQL editor to add the current_job field to student_profiles

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS current_job text;
