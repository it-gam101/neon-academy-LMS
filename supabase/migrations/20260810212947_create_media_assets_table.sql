CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'pdf')),
  r2_key TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_assets_owner ON public.media_assets(owner_id);
CREATE INDEX idx_media_assets_kind ON public.media_assets(kind);
CREATE INDEX idx_media_assets_created ON public.media_assets(created_at DESC);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- SELECT: authors only. Learners never query this table — they load the URL
-- straight from modules.content_json.
CREATE POLICY "media_assets_select_authors"
  ON public.media_assets
  FOR SELECT
  TO authenticated
  USING (public.current_role() IN ('super_admin', 'hr_manager', 'instructor'));

-- DELETE: owner, or any admin.
CREATE POLICY "media_assets_delete_owner_or_admin"
  ON public.media_assets
  FOR DELETE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()) OR public.is_admin());

-- NO INSERT policy and NO UPDATE policy, deliberately:
--   INSERT is performed solely by the media-finalize Edge Function using the
--   service role (mirrors scorm_packages). Assets are immutable — re-upload
--   rather than mutate.