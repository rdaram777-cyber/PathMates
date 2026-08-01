-- Migration 008: Add professional profile details
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
  ADD COLUMN IF NOT EXISTS current_role TEXT,
  ADD COLUMN IF NOT EXISTS headline TEXT;
