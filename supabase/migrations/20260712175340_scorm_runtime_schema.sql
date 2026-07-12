-- =============================================================================
-- SCORM RUNTIME SCHEMA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1: Create scorm_packages table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scorm_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  scorm_version TEXT NOT NULL CHECK (scorm_version IN ('1.2', '2004_3rd', '2004_4th')),
  storage_base_url TEXT NOT NULL,
  entry_point TEXT NOT NULL,
  manifest_json JSONB,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id),
  is_public_sandbox BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_scorm_packages_uploaded_by ON public.scorm_packages(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_scorm_packages_public_sandbox ON public.scorm_packages(is_public_sandbox);

-- Enable RLS
ALTER TABLE public.scorm_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scorm_packages
-- SELECT: authenticated users can see non-sandbox packages
CREATE POLICY "scorm_packages_select_authenticated"
  ON public.scorm_packages
  FOR SELECT
  TO authenticated
  USING (is_public_sandbox = false);

-- INSERT/UPDATE/DELETE: HR and Admin only
CREATE POLICY "scorm_packages_insert_hr_admin"
  ON public.scorm_packages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_hr_or_admin());

CREATE POLICY "scorm_packages_update_hr_admin"
  ON public.scorm_packages
  FOR UPDATE
  TO authenticated
  USING (public.is_hr_or_admin())
  WITH CHECK (public.is_hr_or_admin());

CREATE POLICY "scorm_packages_delete_hr_admin"
  ON public.scorm_packages
  FOR DELETE
  TO authenticated
  USING (public.is_hr_or_admin());

-- -----------------------------------------------------------------------------
-- PART 2: Create scorm_registrations table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scorm_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.scorm_packages(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  cmi_data JSONB,
  completion_status TEXT,
  success_status TEXT,
  score_raw NUMERIC,
  total_time TEXT,
  suspend_data TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, package_id, enrollment_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scorm_registrations_user_id ON public.scorm_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_scorm_registrations_package_id ON public.scorm_registrations(package_id);
CREATE INDEX IF NOT EXISTS idx_scorm_registrations_enrollment_id ON public.scorm_registrations(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_scorm_registrations_module_id ON public.scorm_registrations(module_id);

-- Enable RLS
ALTER TABLE public.scorm_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scorm_registrations
-- SELECT own rows
CREATE POLICY "scorm_registrations_select_own"
  ON public.scorm_registrations
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- SELECT for team managers via is_direct_report
CREATE POLICY "scorm_registrations_select_team_manager"
  ON public.scorm_registrations
  FOR SELECT
  TO authenticated
  USING (public.is_direct_report(user_id));

-- SELECT for instructors where enrollment belongs to their course
CREATE POLICY "scorm_registrations_select_instructor"
  ON public.scorm_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.courses c ON c.id = e.course_id
      WHERE e.id = scorm_registrations.enrollment_id
      AND c.created_by = (SELECT auth.uid())
    )
  );

-- SELECT all for HR and Admin
CREATE POLICY "scorm_registrations_select_hr_admin"
  ON public.scorm_registrations
  FOR SELECT
  TO authenticated
  USING (public.is_hr_or_admin());

-- NO INSERT/UPDATE/DELETE policies - writes happen via Edge Function with service role

-- -----------------------------------------------------------------------------
-- PART 3: Add FK constraint from modules.scorm_package_id to scorm_packages
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'modules_scorm_package_id_fkey'
  ) THEN
    ALTER TABLE public.modules 
    ADD CONSTRAINT modules_scorm_package_id_fkey 
    FOREIGN KEY (scorm_package_id) REFERENCES public.scorm_packages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PART 4: Seed Data - SCORM package and course
-- -----------------------------------------------------------------------------

-- Insert SCORM package (get super_admin ID dynamically)
INSERT INTO public.scorm_packages (
  id,
  title,
  scorm_version,
  storage_base_url,
  entry_point,
  uploaded_by,
  is_public_sandbox
)
SELECT 
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'MBTI Micro-Course',
  '1.2',
  'https://pub-390efbd60a134343a0477c83ce0cebfb.r2.dev/packages/mbti-v1',
  'index.html',
  p.id,
  false
FROM public.profiles p
WHERE p.role = 'super_admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert course for SCORM package (using correct column names: status, estimated_minutes)
INSERT INTO public.courses (
  id,
  title_en,
  title_he,
  description_en,
  description_he,
  category_id,
  course_type,
  status,
  is_mandatory,
  estimated_minutes,
  created_by
)
SELECT 
  'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
  'Personality Types (MBTI)',
  'טיפוסי אישיות (MBTI)',
  'Discover your personality type with this interactive MBTI assessment. Understand your preferences and how they affect your work style.',
  'גלה את טיפוס האישיות שלך עם שאלון MBTI אינטראקטיבי זה. הבן את ההעדפות שלך וכיצד הן משפיעות על סגנון העבודה שלך.',
  (SELECT id FROM public.course_categories WHERE name_en = 'Professional Skills' LIMIT 1),
  'scorm',
  'published',
  false,
  15,
  p.id
FROM public.profiles p
WHERE p.role = 'super_admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert module linked to SCORM package
INSERT INTO public.modules (
  id,
  course_id,
  title_en,
  title_he,
  module_type,
  scorm_package_id,
  sort_order
)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid,
  'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
  'MBTI Assessment',
  'שאלון MBTI',
  'scorm_package',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  1
)
ON CONFLICT DO NOTHING;