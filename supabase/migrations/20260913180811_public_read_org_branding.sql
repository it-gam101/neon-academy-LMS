CREATE POLICY "public_read_org_branding"
  ON public.org_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);