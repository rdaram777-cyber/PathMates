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
