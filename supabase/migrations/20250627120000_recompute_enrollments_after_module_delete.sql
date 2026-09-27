-- Item 106 — policy C (hybrid): when a module is DELETED, re-evaluate the enrollments of that
-- course that are NOT yet completed, so a learner whose last unfinished module was removed is
-- completed instead of being stuck in progress forever.
--
-- Only DELETE needs this. Adding a module can never complete anyone: in-progress learners stay in
-- progress by definition, and completed learners stay completed by policy (completion is sticky).
--
-- Same completion rule as the two existing writers (scorm-commit and useCourseModules):
--   status = 'completed' AND passed IS DISTINCT FROM false
-- NEVER passed = true — NULL means "not applicable" (a lesson) and must keep counting.
--
-- SECURITY DEFINER is permitted here because this is a TRIGGER function (standing rule 1): the
-- instructor deleting a module cannot UPDATE other users' enrollments under RLS.

CREATE OR REPLACE FUNCTION public.recompute_enrollments_after_module_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed INT;
BEGIN
  -- Guard 1: the COURSE is being deleted (the module delete is its cascade). Nothing to
  -- re-evaluate, and the course's enrollments are being cascaded away in the same statement.
  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id = OLD.course_id) THEN
    RETURN NULL;
  END IF;

  -- Guard 2: no modules left. "Every module completed" is TRUE over an empty set, so without
  -- this guard deleting a course's last module would mark every enrolled learner completed.
  IF NOT EXISTS (SELECT 1 FROM public.modules WHERE course_id = OLD.course_id) THEN
    RETURN NULL;
  END IF;

  UPDATE public.enrollments e
  SET status       = 'completed',
      completed_at = now(),
      -- Average over the course's CURRENT modules only, so the result does not depend on
      -- whether the removed module's progress rows have been cascaded away yet.
      score        = (
        SELECT avg(mp.score)
        FROM public.module_progress mp
        JOIN public.modules m ON m.id = mp.module_id
        WHERE mp.enrollment_id = e.id
          AND m.course_id = OLD.course_id
          AND mp.score IS NOT NULL
      )
  WHERE e.course_id = OLD.course_id
    AND e.status <> 'completed'          -- sticky: never touch a completed enrollment
    AND NOT EXISTS (                     -- no remaining module is unfinished (or failed)
      SELECT 1
      FROM public.modules m
      WHERE m.course_id = OLD.course_id
        AND NOT EXISTS (
          SELECT 1
          FROM public.module_progress mp
          WHERE mp.enrollment_id = e.id
            AND mp.module_id = m.id
            AND mp.status = 'completed'
            AND mp.passed IS DISTINCT FROM false
        )
    );

  GET DIAGNOSTICS v_completed = ROW_COUNT;

  IF v_completed > 0 THEN
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, meta)
    VALUES (
      (SELECT auth.uid()),
      'enrollments_completed_by_module_delete',
      'modules',
      OLD.id,
      jsonb_build_object(
        'course_id', OLD.course_id,
        'module_title_en', OLD.title_en,
        'enrollments_completed', v_completed
      )
    );
  END IF;

  RETURN NULL; -- ignored for an AFTER trigger
END;
$$;

DROP TRIGGER IF EXISTS recompute_enrollments_after_module_delete_trigger ON public.modules;

CREATE TRIGGER recompute_enrollments_after_module_delete_trigger
  AFTER DELETE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_enrollments_after_module_delete();
