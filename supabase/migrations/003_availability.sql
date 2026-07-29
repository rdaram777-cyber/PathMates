-- ============================================================
-- Phase 3: Availability Slots
-- ============================================================

CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure start is before end
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_availability_user_id ON public.availability_slots(user_id);

-- ============================================================
-- RLS for availability_slots
-- ============================================================
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read any user's availability
CREATE POLICY "availability_select" ON public.availability_slots
  FOR SELECT TO authenticated
  USING (true);

-- Users can only manage their own availability
CREATE POLICY "availability_insert_own" ON public.availability_slots
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "availability_update_own" ON public.availability_slots
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "availability_delete_own" ON public.availability_slots
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
