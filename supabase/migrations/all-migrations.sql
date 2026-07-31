-- PathMates MVP Schema
-- Migration 001: Core tables, RLS policies, and seed data

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  bio         TEXT,
  avatar_url  TEXT,
  languages   TEXT[] DEFAULT '{}',
  skills      TEXT[] DEFAULT '{}',
  role        TEXT NOT NULL DEFAULT 'explorer'
              CHECK (role IN ('explorer', 'pathmate', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'explorer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. EXPERIENCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.experiences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for search
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_category_id ON public.experiences(category_id);

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- --- profiles ---
-- Anyone authenticated can read all profiles
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (needed for trigger fallback)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- --- categories ---
-- Anyone authenticated can read categories
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can insert/update/delete categories
CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- --- experiences ---
-- Anyone authenticated can read experiences
CREATE POLICY "experiences_select" ON public.experiences
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can create experiences
CREATE POLICY "experiences_insert" ON public.experiences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owners can update their own experiences
CREATE POLICY "experiences_update_own" ON public.experiences
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owners can delete their own experiences
CREATE POLICY "experiences_delete_own" ON public.experiences
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. SEED DATA
-- ============================================================

-- Seed categories
INSERT INTO public.categories (name, slug) VALUES
  ('Business', 'business'),
  ('Career', 'career'),
  ('Relocation', 'relocation')
ON CONFLICT (slug) DO NOTHING;

-- Seed demo experiences (uses a placeholder UUID; replace with real user IDs in code)
-- These are documented for reference but won't insert without a valid user_id.
-- The application code handles demo data display.
-- To seed manually, replace '00000000-0000-0000-0000-000000000000' with a real user UUID:
-- INSERT INTO public.experiences (user_id, title, content, category_id)
-- VALUES
--   ('00000000-0000-0000-0000-000000000000', 'I have experience in business and can share my experience.', 'I can share what I learned, what worked and what I would do differently.', (SELECT id FROM public.categories WHERE slug = 'business')),
--   ('00000000-0000-0000-0000-000000000000', 'Moved to another country and found a new career.', 'I can share my real experience with relocation, applications and starting again.', (SELECT id FROM public.categories WHERE slug = 'career')),
--   ('00000000-0000-0000-0000-000000000000', 'Started a project from scratch.', 'Here is what I learned from the first idea to the first result.', (SELECT id FROM public.categories WHERE slug = 'business'));
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
-- ============================================================
-- Phase 5: Platform Settings & Admin RLS Policies
-- ============================================================

-- Platform settings table (key-value store)
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default commission
INSERT INTO platform_settings (key, value) VALUES ('commission_percent', '30')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- RLS for platform_settings
-- ============================================================
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read platform settings
CREATE POLICY "platform_settings_select_admin" ON public.platform_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert/update platform settings
CREATE POLICY "platform_settings_insert_admin" ON public.platform_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "platform_settings_update_admin" ON public.platform_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Admin RLS policies for bookings (admins can see/manage all)
-- ============================================================
CREATE POLICY "bookings_select_admin" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "bookings_update_admin" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Admin RLS policies for profiles (admins can update any)
-- ============================================================
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Admin RLS policies for experiences (admins can delete any)
-- ============================================================
CREATE POLICY "experiences_delete_admin" ON public.experiences
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'booking_confirmed', 'new_review', 'booking_reminder', 'system'
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- optional link to relevant page
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user-specific queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

-- RLS: users can only see their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);
-- Migration 007: complete category seed and public reads
-- Add 16 categories
INSERT INTO public.categories (name, slug) VALUES
  ('Business', 'business'),
  ('Career', 'career'),
  ('Education', 'education'),
  ('Abroad', 'abroad'),
  ('Technology', 'technology'),
  ('Freelancing', 'freelancing'),
  ('Finance', 'finance'),
  ('Health', 'health'),
  ('Relationships', 'relationships'),
  ('Parenting', 'parenting'),
  ('Entrepreneurship', 'entrepreneurship'),
  ('Interviews', 'interviews'),
  ('Visa & Immigration', 'visa-immigration'),
  ('Startups', 'startups'),
  ('Marketing', 'marketing'),
  ('Other', 'other')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Allow anon/public reads for categories (needed for landing page and share page)
CREATE POLICY "categories_select_anon" ON public.categories
  FOR SELECT TO anon
  USING (true);
