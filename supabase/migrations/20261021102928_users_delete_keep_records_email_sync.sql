-- Items 108 + 120, window 1 of 4 — the database change ONLY (no app code). Deleting a user (108) and changing an
-- e-mail (120) need the service role, so they come in window 2 (an Edge Function); the screens in windows 3 and 4.
-- Nothing here deletes or changes any existing row: it only changes what happens WHEN a user is deleted, and keeps
-- profiles.email in step when a login e-mail changes.

-- (1) Deleting a user who uploaded a SCORM package was REFUSED: scorm_packages.uploaded_by had no ON DELETE rule.
--     The package stays; its uploader becomes empty.
ALTER TABLE public.scorm_packages
  DROP CONSTRAINT scorm_packages_uploaded_by_fkey,
  ADD CONSTRAINT scorm_packages_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- (2) Isaac, 2026-09-28: a deleted learner's completions and scores are KEPT, anonymised. Their enrollments stay
--     (and with them each module's progress), with user_id empty. ("Erase everything" deletes the enrollments first,
--     in the window-2 function.) UNIQUE (user_id, course_id) still holds for real users; empty ones never collide.
ALTER TABLE public.enrollments
  ALTER COLUMN user_id DROP NOT NULL,
  DROP CONSTRAINT enrollments_user_id_fkey,
  ADD CONSTRAINT enrollments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- (3) Item 120: profiles.email was copied ONCE at sign-up and never again. When a login e-mail changes (after the
--     user confirms it, or at once by an admin), copy it to the profile and write an "email_changed" audit row.
--     A trigger function may be SECURITY DEFINER (rule 1). Like handle_new_user(), it must never block the auth
--     change itself: any error becomes a warning. The two steps are guarded separately, so a failed audit row can
--     never undo the profile's e-mail.
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  BEGIN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_user_email_change: profile e-mail sync failed for %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, meta)
    VALUES (
      NEW.id,
      'email_changed',
      'profiles',
      NEW.id,
      jsonb_build_object('from', OLD.email, 'to', NEW.email)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_user_email_change: audit insert failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$func$;

CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_user_email_change();