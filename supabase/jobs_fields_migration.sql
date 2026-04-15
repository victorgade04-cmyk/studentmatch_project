-- Run this in the Supabase SQL editor to add new fields to the jobs table

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS deadline date,
  ADD COLUMN IF NOT EXISTS job_type text,
  ADD COLUMN IF NOT EXISTS location text;
