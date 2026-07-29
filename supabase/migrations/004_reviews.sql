-- ============================================================
-- Phase 4: Reviews, Ratings & PathMate Reputation
-- ============================================================

-- Reviews table: one review per booking
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) UNIQUE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  pathmate_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add rating/reputation columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_pathmate_id ON public.reviews(pathmate_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);

-- ============================================================
-- RLS for reviews
-- ============================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read all reviews
CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT TO authenticated
  USING (true);

-- Only the reviewer (explorer) can insert their own review
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Only the reviewer can update their own review
CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- Only the reviewer can delete their own review
CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = reviewer_id);
