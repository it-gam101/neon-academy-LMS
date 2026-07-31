CREATE OR REPLACE FUNCTION public.audit_course_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment_count INT;
BEGIN
  -- Counted BEFORE the delete: once the cascade runs these rows are gone.
  SELECT COUNT(*) INTO v_enrollment_count
  FROM public.enrollments
  WHERE course_id = OLD.id;

  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, meta)
  VALUES (
    (SELECT auth.uid()),
    'course_deleted',
    'courses',
    OLD.id,
    jsonb_build_object(
      'title_en', OLD.title_en,
      'title_he', OLD.title_he,
      'status', OLD.status,
      'created_by', OLD.created_by,
      'enrollments_destroyed', v_enrollment_count
    )
  );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS audit_course_deletion_trigger ON public.courses;

CREATE TRIGGER audit_course_deletion_trigger
  BEFORE DELETE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_course_deletion();