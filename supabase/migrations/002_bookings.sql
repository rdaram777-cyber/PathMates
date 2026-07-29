-- ============================================================
-- Phase 3: Bookings & Payments Schema
-- ============================================================

-- Add hourly_rate and bio_short to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate INTEGER DEFAULT 5000; -- in cents ($50.00)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio_short TEXT;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  explorer_id UUID NOT NULL REFERENCES auth.users(id),
  pathmate_id UUID NOT NULL REFERENCES auth.users(id),
  experience_id UUID REFERENCES experiences(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  amount_cents INTEGER NOT NULL, -- total amount in cents
  platform_fee_cents INTEGER NOT NULL, -- 30% commission
  pathmate_earnings_cents INTEGER NOT NULL, -- 70% to PathMate
  stripe_session_id TEXT,
  stripe_payment_status TEXT DEFAULT 'pending',
  meeting_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','completed','cancelled','refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_explorer_id ON public.bookings(explorer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pathmate_id ON public.bookings(pathmate_id);
CREATE INDEX IF NOT EXISTS idx_bookings_experience_id ON public.bookings(experience_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- updated_at trigger for bookings
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS for bookings
-- ============================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Explorers can read their own bookings
CREATE POLICY "bookings_select_explorer" ON public.bookings
  FOR SELECT TO authenticated
  USING (explorer_id = auth.uid());

-- PathMates can read bookings where they're the pathmate
CREATE POLICY "bookings_select_pathmate" ON public.bookings
  FOR SELECT TO authenticated
  USING (pathmate_id = auth.uid());

-- Explorers can insert bookings (they are the ones booking)
CREATE POLICY "bookings_insert_explorer" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (explorer_id = auth.uid());

-- PathMates can update bookings (e.g., mark as completed)
CREATE POLICY "bookings_update_pathmate" ON public.bookings
  FOR UPDATE TO authenticated
  USING (pathmate_id = auth.uid());

-- Explorers can update their own bookings (e.g., cancel)
CREATE POLICY "bookings_update_explorer" ON public.bookings
  FOR UPDATE TO authenticated
  USING (explorer_id = auth.uid());
