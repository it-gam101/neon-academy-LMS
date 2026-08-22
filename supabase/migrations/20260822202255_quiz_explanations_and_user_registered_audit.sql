-- 1. quiz_questions: per-question explanations
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS explanation_en TEXT,
  ADD COLUMN IF NOT EXISTS explanation_he TEXT;

-- 2. handle_new_user(): also record a user_registered audit row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  has_super_admin BOOLEAN;
  new_role TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'super_admin'
  ) INTO has_super_admin;

  IF NOT has_super_admin THEN
    new_role := 'super_admin';
  ELSE
    new_role := 'employee';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_role
  );

  -- Audit the registration.
  -- MUST come after the profile INSERT: audit_log.actor_id FKs to profiles(id).
  -- The exception handler is load-bearing. This is an AFTER INSERT trigger on
  -- auth.users; an unhandled error here ROLLS BACK THE SIGNUP. A notification
  -- feature must never be able to block registration.
  BEGIN
    INSERT INTO public.audit_log (actor_id, action, entity, entity_id, meta)
    VALUES (
      NEW.id,
      'user_registered',
      'profiles',
      NEW.id,
      jsonb_build_object(
        'email', NEW.email,
        'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'assigned_role', new_role
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: audit insert failed for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$func$;