-- Item 121 — open enrolment per course (Isaac, 2026-10-21). A course is either OPEN — it is listed in the Catalogue
-- and anyone signed in can enrol themselves, which is how every course worked until now — or ASSIGNED ONLY: admins, HR
-- and team managers assign it. New courses start assigned-only, and EXISTING courses are closed too (Isaac's
-- decision): he opens the ones that should stay in the Catalogue. Nothing here touches an enrollment, so everyone
-- already enrolled keeps their course; and a course stays readable exactly as before.

-- (1) The setting. NOT NULL DEFAULT false: existing rows read false (closed), and so does every new course.
ALTER TABLE public.courses
  ADD COLUMN open_enrollment BOOLEAN NOT NULL DEFAULT false;

-- (2) Self-enrolment also requires an OPEN course. ALTER POLICY changes this one policy in place (as migration
--     20261010195809 did); assignment by admins, HR and team managers goes through their own policies, unchanged.
ALTER POLICY "users_self_enroll_published"
  ON public.enrollments
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND assigned_by IS NULL
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id
      AND c.status = 'published'
      AND c.open_enrollment
    )
  );