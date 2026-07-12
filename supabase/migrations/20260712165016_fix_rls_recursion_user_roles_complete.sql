-- =============================================================================
-- FIX RLS RECURSION - USER_ROLES APPROACH (IDEMPOTENT)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Ensure user_roles table exists
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'learner',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- STEP 2: Create non-recursive RLS policy on user_roles (idempotent)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;

CREATE POLICY "users_read_own_role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- STEP 3: Backfill existing data from profiles
-- -----------------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role, updated_at)
SELECT id, role, now()
FROM public.profiles
ON CONFLICT (user_id) DO UPDATE SET 
  role = EXCLUDED.role,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- STEP 4: Create sync trigger function (SECURITY DEFINER for triggers)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_user_role_to_lookup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, updated_at)
  VALUES (NEW.id, NEW.role, now())
  ON CONFLICT (user_id) DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.profiles;

CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_to_lookup();

-- -----------------------------------------------------------------------------
-- STEP 5: Replace helper functions to query user_roles
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (SELECT auth.uid()) 
    AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_hr_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (SELECT auth.uid()) 
    AND role IN ('super_admin', 'hr_manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_direct_report(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = check_user_id 
    AND manager_id = (SELECT auth.uid())
  )
$$;

-- -----------------------------------------------------------------------------
-- STEP 6: Replace the three recursive profiles policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "super_admin_full_access" ON public.profiles;
DROP POLICY IF EXISTS "hr_manager_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "hr_manager_update_profiles" ON public.profiles;

CREATE POLICY "super_admin_full_access"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "hr_manager_read_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.current_role() = 'hr_manager');

CREATE POLICY "hr_manager_update_profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.current_role() = 'hr_manager')
  WITH CHECK (public.current_role() = 'hr_manager');