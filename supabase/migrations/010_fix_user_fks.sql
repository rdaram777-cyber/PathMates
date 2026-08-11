-- OPTIONAL (schema hygiene): code no longer embeds profiles (2026-08-11) — see src/lib; kept for future embeds / FK correctness.
-- ============================================================
-- 010_fix_user_fks.sql
-- Fix PostgREST relationships: point app user FKs at public.profiles
-- so that `profiles(...)` embeds resolve at runtime.
--
-- Root cause: experiences.user_id, bookings.explorer_id/pathmate_id,
-- reviews.reviewer_id/pathmate_id, notifications.user_id and
-- availability_slots.user_id all reference auth.users(id) directly.
-- PostgREST only exposes relationships between public-schema tables,
-- so every query embedding `profiles(...)` failed with PGRST200
-- ("Could not find a relationship between X and profiles"), which made
-- getExperience() return null -> "Experience not found", and made the
-- homepage/search/admin lists silently empty.
--
-- profiles.id already REFERENCES auth.users(id) ON DELETE CASCADE, and a
-- trigger (handle_new_user) auto-creates a profile for every auth user,
-- so re-pointing these FKs at public.profiles preserves referential
-- integrity transitively. Constraint names are kept identical so the
-- hinted embeds in the code (e.g. profiles!bookings_explorer_id_fkey)
-- resolve to the corrected FKs.
-- ============================================================

BEGIN;

-- experiences
ALTER TABLE public.experiences
  DROP CONSTRAINT IF EXISTS experiences_user_id_fkey,
  ADD CONSTRAINT experiences_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- bookings
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_explorer_id_fkey,
  ADD CONSTRAINT bookings_explorer_id_fkey
    FOREIGN KEY (explorer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS bookings_pathmate_id_fkey,
  ADD CONSTRAINT bookings_pathmate_id_fkey
    FOREIGN KEY (pathmate_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- reviews
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey,
  ADD CONSTRAINT reviews_reviewer_id_fkey
    FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS reviews_pathmate_id_fkey,
  ADD CONSTRAINT reviews_pathmate_id_fkey
    FOREIGN KEY (pathmate_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- notifications
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- availability_slots
ALTER TABLE public.availability_slots
  DROP CONSTRAINT IF EXISTS availability_slots_user_id_fkey,
  ADD CONSTRAINT availability_slots_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Reload PostgREST schema cache so the new relationships take effect
NOTIFY pgrst, 'reload schema';

COMMIT;
