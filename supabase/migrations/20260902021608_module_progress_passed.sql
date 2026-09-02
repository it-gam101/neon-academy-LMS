-- Item 78 window 2 — record pass/fail alongside completion.
--
-- Deliberately a SEPARATE column rather than a new value in the `status` CHECK.
-- Conflating completion with success is the SCORM 1.2 mistake this project has
-- already paid to learn: 1.2 has one lesson_status field and no vocabulary for
-- "finished but failed", which is why SCORM 2004 splits completion_status from
-- success_status. Our data follows the split.
--
-- NULL means "not applicable" (a lesson) or "unknown" (a legacy row). Every
-- consumer must treat NULL exactly as it behaves today.

ALTER TABLE public.module_progress
  ADD COLUMN passed BOOLEAN;

-- Backfill SCORM modules from the registration that already knows the answer.
-- The IN ('passed','failed') filter is load-bearing: SCORM 2004 also writes
-- 'unknown' and 'not attempted', and those must stay NULL rather than becoming
-- false. Without it every un-assessed SCORM module is recorded as a failure.
UPDATE public.module_progress mp
SET passed = (sr.success_status = 'passed')
FROM public.scorm_registrations sr
WHERE sr.enrollment_id = mp.enrollment_id
  AND sr.module_id     = mp.module_id
  AND sr.success_status IN ('passed', 'failed');

-- Backfill quiz modules. bool_or = best-of-attempts, which matches what the
-- quiz player already shows the learner. Attempt-by-attempt truth stays in
-- quiz_attempts; this column records the outcome.
--
-- quiz_attempts is keyed by quiz_id + user_id, NOT by enrollment, so the join
-- to enrollments MUST be scoped by course_id as well as user_id. Without that
-- line a learner enrolled in two courses gets attempts bleeding across them.
UPDATE public.module_progress mp
SET passed = agg.any_passed
FROM (
  SELECT q.module_id,
         e.id AS enrollment_id,
         bool_or(qa.passed) AS any_passed
  FROM public.quiz_attempts qa
  JOIN public.quizzes     q ON q.id = qa.quiz_id
  JOIN public.modules     m ON m.id = q.module_id
  JOIN public.enrollments e ON e.user_id = qa.user_id
                           AND e.course_id = m.course_id
  WHERE qa.passed IS NOT NULL
  GROUP BY q.module_id, e.id
) agg
WHERE agg.module_id     = mp.module_id
  AND agg.enrollment_id = mp.enrollment_id;