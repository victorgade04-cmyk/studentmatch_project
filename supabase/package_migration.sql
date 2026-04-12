-- Run this in the Supabase SQL editor to add the student package system

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS package text NOT NULL DEFAULT 'bronze'
  CHECK (package IN ('bronze', 'silver', 'gold'));
git add . && git commit -m "add student package system" && git push
