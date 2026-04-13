-- Run this in the Supabase SQL editor to add the company package system

ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS package text NOT NULL DEFAULT 'startup'
  CHECK (package IN ('startup', 'small', 'medium', 'enterprise'));
