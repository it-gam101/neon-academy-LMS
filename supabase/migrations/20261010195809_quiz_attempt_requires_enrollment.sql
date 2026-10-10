-- Dispatch 2 — a quiz attempt is accepted only from a learner enrolled in that quiz's course.
--
-- QA pre-run 2026-10-07 (K-02): any signed-in employee could open a published course's quiz by its address and
-- submit it, and "users_insert_own_attempts" (WITH CHECK user_id = auth.uid()) accepted the attempt with no
-- enrollment behind it. Decided by Isaac 2026-10-07 (board decisions/d-2026-10-07-enroll-gate). The app now hides
-- Start Quiz without an enrollment; this makes the database say the same thing.
--
-- ALTER POLICY, not DROP + CREATE: the one policy is changed in place and nothing else is touched. The subquery reads
-- quizzes -> modules -> enrollments under the caller's own RLS (a learner reads their own enrollments and the
-- published course's modules and quizzes), so no SECURITY DEFINER function is involved, and it does not read
-- quiz_attempts itself (no recursion). Super admins keep their own FOR ALL policy, unchanged.
ALTER POLICY "users_insert_own_attempts"
  ON public.quiz_attempts
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.quizzes q
      JOIN public.modules m ON m.id = q.module_id
      JOIN public.enrollments e ON e.course_id = m.course_id
      WHERE q.id = quiz_attempts.quiz_id
        AND e.user_id = (SELECT auth.uid())
    )
  );