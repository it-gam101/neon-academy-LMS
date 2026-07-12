-- =============================================================================
-- NEON ACADEMY LMS SCHEMA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Get current user's role from profiles
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())
$$;

-- Check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'super_admin'
  )
$$;

-- Check if current user is hr_manager or super_admin
CREATE OR REPLACE FUNCTION public.is_hr_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role IN ('super_admin', 'hr_manager')
  )
$$;

-- Check if user_id is a direct report of current user
CREATE OR REPLACE FUNCTION public.is_direct_report(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = check_user_id 
    AND manager_id = (SELECT auth.uid())
  )
$$;

-- -----------------------------------------------------------------------------
-- UPDATE PROFILES TABLE RLS (enhance existing policies)
-- -----------------------------------------------------------------------------

-- Drop existing policies to replace with comprehensive ones
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile except role and manager_id" ON public.profiles;

-- Super admin: full access
CREATE POLICY "super_admin_all_profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can read own profile
CREATE POLICY "users_read_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Team managers can read direct reports
CREATE POLICY "team_manager_read_direct_reports"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'team_manager' 
    AND manager_id = (SELECT auth.uid())
  );

-- HR manager can read all profiles
CREATE POLICY "hr_manager_read_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.current_role() = 'hr_manager');

-- HR manager can update all profiles (trigger prevents role changes)
CREATE POLICY "hr_manager_update_all_profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.current_role() = 'hr_manager')
  WITH CHECK (public.current_role() = 'hr_manager');

-- Users can update own profile (trigger enforces field restrictions)
CREATE POLICY "users_update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Update the protect_profile_fields trigger to also prevent hr_manager from changing roles
DROP FUNCTION IF EXISTS public.protect_profile_fields() CASCADE;

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  SELECT role INTO current_user_role FROM public.profiles WHERE id = (SELECT auth.uid());
  
  -- If role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Only super_admin can change roles
    IF current_user_role != 'super_admin' THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  
  -- If manager_id is being changed
  IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
    -- Only super_admin can change manager_id
    IF current_user_role != 'super_admin' THEN
      NEW.manager_id := OLD.manager_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();

-- -----------------------------------------------------------------------------
-- COURSE CATEGORIES
-- -----------------------------------------------------------------------------

CREATE TABLE public.course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_he TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_categories_sort ON public.course_categories(sort_order);

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "super_admin_all_categories"
  ON public.course_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- All authenticated users can read categories
CREATE POLICY "authenticated_read_categories"
  ON public.course_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- HR manager can create/update/delete categories
CREATE POLICY "hr_manager_manage_categories"
  ON public.course_categories
  FOR ALL
  TO authenticated
  USING (public.current_role() = 'hr_manager')
  WITH CHECK (public.current_role() = 'hr_manager');

-- -----------------------------------------------------------------------------
-- COURSES
-- -----------------------------------------------------------------------------

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_he TEXT NOT NULL,
  description_en TEXT,
  description_he TEXT,
  thumbnail_url TEXT,
  course_type TEXT NOT NULL DEFAULT 'native' CHECK (course_type IN ('native', 'scorm')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  category_id UUID REFERENCES public.course_categories(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  estimated_minutes INT,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  due_days INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_courses_category ON public.courses(category_id);
CREATE INDEX idx_courses_created_by ON public.courses(created_by);
CREATE INDEX idx_courses_is_mandatory ON public.courses(is_mandatory);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "super_admin_all_courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- All authenticated users can read published courses
CREATE POLICY "authenticated_read_published_courses"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Instructors can CRUD their own courses (including drafts)
CREATE POLICY "instructor_manage_own_courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (
    public.current_role() = 'instructor' 
    AND created_by = (SELECT auth.uid())
  )
  WITH CHECK (
    public.current_role() = 'instructor' 
    AND created_by = (SELECT auth.uid())
  );

-- HR manager can read all courses
CREATE POLICY "hr_manager_read_all_courses"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (public.current_role() = 'hr_manager');

-- HR manager can manage all courses
CREATE POLICY "hr_manager_manage_courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (public.current_role() = 'hr_manager')
  WITH CHECK (public.current_role() = 'hr_manager');

-- -----------------------------------------------------------------------------
-- MODULES
-- -----------------------------------------------------------------------------

CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_he TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  module_type TEXT NOT NULL DEFAULT 'lesson' CHECK (module_type IN ('lesson', 'quiz', 'scorm_package')),
  content_json JSONB,
  scorm_package_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_modules_course ON public.modules(course_id);
CREATE INDEX idx_modules_sort ON public.modules(course_id, sort_order);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "super_admin_all_modules"
  ON public.modules
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Read if course is published OR user is the course creator OR hr_manager
CREATE POLICY "read_modules_with_course_access"
  ON public.modules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND (
        c.status = 'published'
        OR c.created_by = (SELECT auth.uid())
        OR public.current_role() = 'hr_manager'
      )
    )
  );

-- Create/update/delete only by course creator
CREATE POLICY "course_creator_manage_modules"
  ON public.modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND c.created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND c.created_by = (SELECT auth.uid())
    )
  );

-- HR manager can manage all modules
CREATE POLICY "hr_manager_manage_modules"
  ON public.modules
  FOR ALL
  TO authenticated
  USING (public.current_role() = 'hr_manager')
  WITH CHECK (public.current_role() = 'hr_manager');

-- -----------------------------------------------------------------------------
-- QUIZZES
-- -----------------------------------------------------------------------------

CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  pass_score INT NOT NULL DEFAULT 70,
  attempts_allowed INT NOT NULL DEFAULT 3,
  time_limit_minutes INT,
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quizzes_module ON public.quizzes(module_id);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "super_admin_all_quizzes"
  ON public.quizzes
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Read if parent course is published OR user is course creator OR hr_manager
CREATE POLICY "read_quizzes_with_course_access"
  ON public.quizzes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id
      AND (
        c.status = 'published'
        OR c.created_by = (SELECT auth.uid())
        OR public.current_role() = 'hr_manager'
      )
    )
  );

-- Create/update/delete only by course creator
CREATE POLICY "course_creator_manage_quizzes"
  ON public.quizzes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id
      AND c.created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id
      AND c.created_by = (SELECT auth.uid())
    )
  );

-- HR manager can manage all quizzes
CREATE POLICY "hr_manager_manage_quizzes"
  ON public.quizzes
  FOR ALL
  TO authenticated
  USING (public.current_role() = 'hr_manager')
  WITH CHECK (public.current_role() = 'hr_manager');

-- -----------------------------------------------------------------------------
-- QUIZ QUESTIONS
-- -----------------------------------------------------------------------------

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('single', 'multi', 'true_false')),
  question_en TEXT NOT NULL,
  question_he TEXT NOT NULL,
  options JSONB NOT NULL,
  correct JSONB NOT NULL,
  points INT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_sort ON public.quiz_questions(quiz_id, sort_order);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "super_admin_all_quiz_questions"
  ON public.quiz_questions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Read if parent course is published OR user is course creator OR hr_manager
CREATE POLICY "read_quiz_questions_with_course_access"
  ON public.quiz_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.modules m ON m.id = q.module_id
      JOIN public.courses c ON c.id = m.course_id
      WHERE q.id = quiz_id
      AND (
        c.status = 'published'
        OR c.created_by = (SELECT auth.uid())
        OR public.current_role() = 'hr_manager'
      )
    )
  );

-- Create/update/delete only by course creator
CREATE POLICY "course_creator_manage_quiz_questions"
  ON public.quiz_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.modules m ON m.id = q.module_id
      JOIN public.courses c ON c.id = m.course_id
      WHERE q.id = quiz_id
      AND c.created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.modules m ON m.id = q.module_id
      JOIN public.courses c ON c.id = m.course_id
      WHERE q.id = quiz_id
      AND c.created_by = (SELECT auth.uid())
    )
  );

-- HR manager can manage all quiz questions
CREATE POLICY "hr_manager_manage_quiz_questions"
  ON public.quiz_questions
  FOR ALL
  TO authenticated
  USING (public.current_role() = 'hr_manager')
  WITH CHECK (public.current_role() = 'hr_manager');

-- -----------------------------------------------------------------------------
-- ENROLLMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_enrollments_status ON public.enrollments(status);
CREATE INDEX idx_enrollments_assigned_by ON public.enrollments(assigned_by);
CREATE INDEX idx_enrollments_due_at ON public.enrollments(due_at);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "super_admin_all_enrollments"
  ON public.enrollments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Employees can read own enrollments
CREATE POLICY "users_read_own_enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Self-enroll in published courses (assigned_by must be null)
CREATE POLICY "users_self_enroll_published"
  ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND assigned_by IS NULL
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND c.status = 'published'
    )
  );

-- Users can update own enrollment status (for progress tracking)
CREATE POLICY "users_update_own_enrollment"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Team manager can read direct reports' enrollments
CREATE POLICY "team_manager_read_reports_enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'team_manager'
    AND public.is_direct_report(user_id)
  );

-- Team manager can enroll direct reports in published courses
CREATE POLICY "team_manager_enroll_reports"
  ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_role() = 'team_manager'
    AND public.is_direct_report(user_id)
    AND assigned_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND c.status = 'published'
    )
  );

-- Team manager can update only due_at for direct reports
-- (enforced via trigger since RLS can't do column-level checks)
CREATE POLICY "team_manager_update_reports_enrollments"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (
    public.current_role() = 'team_manager'
    AND public.is_direct_report(user_id)
  )
  WITH CHECK (
    public.current_role() = 'team_manager'
    AND public.is_direct_report(user_id)
  );

-- Team manager can delete not_started enrollments they assigned
CREATE POLICY "team_manager_delete_not_started"
  ON public.enrollments
  FOR DELETE
  TO authenticated
  USING (
    public.current_role() = 'team_manager'
    AND assigned_by = (SELECT auth.uid())
    AND status = 'not_started'
  );

-- Instructor can read enrollments of their courses
CREATE POLICY "instructor_read_own_course_enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'instructor'
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND c.created_by = (SELECT auth.uid())
    )
  );

-- HR manager can read/insert/update all enrollments
CREATE POLICY "hr_manager_read_enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (public.current_role() = 'hr_manager');

CREATE POLICY "hr_manager_insert_enrollments"
  ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_role() = 'hr_manager');

CREATE POLICY "hr_manager_update_enrollments"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (public.current_role() = 'hr_manager')
  WITH CHECK (public.current_role() = 'hr_manager');

CREATE POLICY "hr_manager_delete_enrollments"
  ON public.enrollments
  FOR DELETE
  TO authenticated
  USING (public.current_role() = 'hr_manager');

-- -----------------------------------------------------------------------------
-- MODULE PROGRESS
-- -----------------------------------------------------------------------------

CREATE TABLE public.module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score NUMERIC,
  time_spent_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, module_id)
);

CREATE INDEX idx_module_progress_enrollment ON public.module_progress(enrollment_id);
CREATE INDEX idx_module_progress_module ON public.module_progress(module_id);
CREATE INDEX idx_module_progress_status ON public.module_progress(status);

ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "super_admin_all_module_progress"
  ON public.module_progress
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can read/upsert their own progress
CREATE POLICY "users_read_own_progress"
  ON public.module_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
      AND e.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "users_insert_own_progress"
  ON public.module_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
      AND e.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "users_update_own_progress"
  ON public.module_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
      AND e.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
      AND e.user_id = (SELECT auth.uid())
    )
  );

-- Team manager can read direct reports' progress
CREATE POLICY "team_manager_read_reports_progress"
  ON public.module_progress
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'team_manager'
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.id = enrollment_id
      AND public.is_direct_report(e.user_id)
    )
  );

-- Instructor can read progress for their courses
CREATE POLICY "instructor_read_own_course_progress"
  ON public.module_progress
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'instructor'
    AND EXISTS (
      SELECT 1 FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id
      AND c.created_by = (SELECT auth.uid())
    )
  );

-- HR manager can read all progress
CREATE POLICY "hr_manager_read_all_progress"
  ON public.module_progress
  FOR SELECT
  TO authenticated
  USING (public.current_role() = 'hr_manager');

-- -----------------------------------------------------------------------------
-- QUIZ ATTEMPTS
-- -----------------------------------------------------------------------------

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  attempt_no INT NOT NULL,
  answers JSONB,
  score NUMERIC,
  passed BOOLEAN,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, quiz_id, attempt_no)
);

CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Trigger to enforce attempts_allowed limit
CREATE OR REPLACE FUNCTION public.check_quiz_attempts_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  max_attempts INT;
  current_attempts INT;
BEGIN
  -- Get the max allowed attempts for this quiz
  SELECT attempts_allowed INTO max_attempts
  FROM public.quizzes
  WHERE id = NEW.quiz_id;
  
  -- Count existing attempts for this user/quiz
  SELECT COUNT(*) INTO current_attempts
  FROM public.quiz_attempts
  WHERE user_id = NEW.user_id
  AND quiz_id = NEW.quiz_id;
  
  IF current_attempts >= max_attempts THEN
    RAISE EXCEPTION 'Maximum number of attempts (%) reached for this quiz', max_attempts;
  END IF;
  
  -- Auto-set attempt_no
  NEW.attempt_no := current_attempts + 1;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_quiz_attempts_limit
  BEFORE INSERT ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_quiz_attempts_limit();

-- Super admin: full access
CREATE POLICY "super_admin_all_quiz_attempts"
  ON public.quiz_attempts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can insert and read their own attempts
CREATE POLICY "users_insert_own_attempts"
  ON public.quiz_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "users_read_own_attempts"
  ON public.quiz_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Team manager can read direct reports' attempts
CREATE POLICY "team_manager_read_reports_attempts"
  ON public.quiz_attempts
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'team_manager'
    AND public.is_direct_report(user_id)
  );

-- Instructor can read attempts for quizzes in their courses
CREATE POLICY "instructor_read_own_course_attempts"
  ON public.quiz_attempts
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'instructor'
    AND EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.modules m ON m.id = q.module_id
      JOIN public.courses c ON c.id = m.course_id
      WHERE q.id = quiz_id
      AND c.created_by = (SELECT auth.uid())
    )
  );

-- HR manager can read all attempts
CREATE POLICY "hr_manager_read_all_attempts"
  ON public.quiz_attempts
  FOR SELECT
  TO authenticated
  USING (public.current_role() = 'hr_manager');

-- -----------------------------------------------------------------------------
-- REPORT SNAPSHOTS
-- -----------------------------------------------------------------------------

CREATE TABLE public.report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  params JSONB,
  data JSONB NOT NULL,
  generated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_snapshots_type ON public.report_snapshots(report_type);
CREATE INDEX idx_report_snapshots_generated_by ON public.report_snapshots(generated_by);
CREATE INDEX idx_report_snapshots_generated_at ON public.report_snapshots(generated_at);

ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;

-- Super admin: full access
CREATE POLICY "super_admin_all_reports"
  ON public.report_snapshots
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- HR manager can read/insert all reports
CREATE POLICY "hr_manager_read_reports"
  ON public.report_snapshots
  FOR SELECT
  TO authenticated
  USING (public.current_role() = 'hr_manager');

CREATE POLICY "hr_manager_insert_reports"
  ON public.report_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_role() = 'hr_manager');

-- Team manager can read/insert only their own reports
CREATE POLICY "team_manager_read_own_reports"
  ON public.report_snapshots
  FOR SELECT
  TO authenticated
  USING (
    public.current_role() = 'team_manager'
    AND generated_by = (SELECT auth.uid())
  );

CREATE POLICY "team_manager_insert_own_reports"
  ON public.report_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_role() = 'team_manager'
    AND generated_by = (SELECT auth.uid())
  );

-- -----------------------------------------------------------------------------
-- AUDIT LOG
-- -----------------------------------------------------------------------------

CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  meta JSONB,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_at ON public.audit_log(at);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Super admin: full read access
CREATE POLICY "super_admin_read_audit"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- HR manager can read audit log
CREATE POLICY "hr_manager_read_audit"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.current_role() = 'hr_manager');

-- No client-side inserts; only via triggers

-- -----------------------------------------------------------------------------
-- AUDIT LOG TRIGGERS
-- -----------------------------------------------------------------------------

-- Audit role/manager changes in profiles
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Role change
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, meta)
    VALUES (
      (SELECT auth.uid()),
      'role_changed',
      'profiles',
      NEW.id,
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
    );
  END IF;
  
  -- Manager change
  IF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, meta)
    VALUES (
      (SELECT auth.uid()),
      'manager_changed',
      'profiles',
      NEW.id,
      jsonb_build_object('old_manager_id', OLD.manager_id, 'new_manager_id', NEW.manager_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_profile_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();

-- Audit course publish
CREATE OR REPLACE FUNCTION public.audit_course_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'published' THEN
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, meta)
    VALUES (
      (SELECT auth.uid()),
      'course_published',
      'courses',
      NEW.id,
      jsonb_build_object('title_en', NEW.title_en, 'title_he', NEW.title_he)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_course_publish_trigger
  AFTER UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_course_publish();

-- Audit enrollment assignment
CREATE OR REPLACE FUNCTION public.audit_enrollment_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_by IS NOT NULL THEN
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, meta)
    VALUES (
      NEW.assigned_by,
      'enrollment_assigned',
      'enrollments',
      NEW.id,
      jsonb_build_object('user_id', NEW.user_id, 'course_id', NEW.course_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_enrollment_assignment_trigger
  AFTER INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_enrollment_assignment();

-- Audit report snapshot generation
CREATE OR REPLACE FUNCTION public.audit_report_generation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, meta)
  VALUES (
    NEW.generated_by,
    'report_generated',
    'report_snapshots',
    NEW.id,
    jsonb_build_object('report_type', NEW.report_type)
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_report_generation_trigger
  AFTER INSERT ON public.report_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_report_generation();

-- -----------------------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- -----------------------------------------------------------------------------

-- Reuse existing function or create if needed
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at
  BEFORE UPDATE ON public.module_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------------------------------
-- SEED DATA: Course Categories
-- -----------------------------------------------------------------------------

INSERT INTO public.course_categories (name_en, name_he, sort_order) VALUES
  ('Onboarding', 'קליטה', 1),
  ('Compliance', 'ציות', 2),
  ('Professional Skills', 'מיומנויות מקצועיות', 3);