-- Item 118 — a course's completion record keeps its FIRST completion date and its BEST score.
-- Decided by Isaac 2026-09-30: "First date, best score".
--
-- Why a trigger: both writers that complete a course — the app's rollup (useCourseModules) and the
-- scorm-commit Edge Function — re-write completed_at = now() and the score whenever every module is
-- done, even when the enrollment is ALREADY completed. So a learner who retakes a quiz after completing
-- moved the completion date HR reports, and a weaker retake lowered the recorded score. Fixing it in
-- the database covers both writers, and any future one, without an Edge Function change.
--
-- Scope: only an update that keeps a COMPLETED enrollment completed. A demotion (completed ->
-- in_progress, item 78) is untouched, and a later re-completion is a genuinely new completion.
-- Not SECURITY DEFINER: a BEFORE trigger that only adjusts NEW needs no extra rights.

CREATE OR REPLACE FUNCTION public.keep_first_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW.status = 'completed' THEN
    -- The first completion date stands. COALESCE: a legacy row completed without a date takes the new one.
    NEW.completed_at := COALESCE(OLD.completed_at, NEW.completed_at);
    -- The best score stands. GREATEST ignores NULL, so a missing score never erases a recorded one.
    NEW.score := GREATEST(OLD.score, NEW.score);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS keep_first_completion_trigger ON public.enrollments;

CREATE TRIGGER keep_first_completion_trigger
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.keep_first_completion();