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
