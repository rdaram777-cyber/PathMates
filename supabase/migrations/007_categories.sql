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
