-- =============================================================================
-- FIX RLS RECURSION - USER_ROLES APPROACH
-- =============================================================================
-- Creates a separate user_roles table with non-recursive RLS to break the
-- infinite recursion cycle. Helper functions query user_roles instead of
-- profiles, and profiles.role remains the authoritative user-facing value.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Create user_roles table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'learner',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- STEP 2: Create SIMPLE, non-recursive RLS policy on user_roles
-- CRITICAL: This policy must ONLY use auth.uid() checks - NO helper function
-- calls, otherwise we recreate the recursion problem.
-- -----------------------------------------------------------------------------
CREATE POLICY "users_read_own_role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- No INSERT/UPDATE/DELETE policies - only the sync trigger writes to this table

-- -----------------------------------------------------------------------------
-- STEP 3: Backfill existing data from profiles
-- This MUST happen before switching helper functions so existing sessions
-- retain their permissions when policies switch over.
-- -----------------------------------------------------------------------------
INSERT INTO public.user_roles (user_id, role, updated_at)
SELECT id, role, now()
FROM public.profiles
ON CONFLICT (user_id) DO UPDATE SET 
  role = EXCLUDED.role,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- STEP 4: Create sync trigger function (SECURITY DEFINER allowed for triggers)
-- Fires on INSERT and UPDATE OF role on profiles to keep user_roles in sync.
-- Handles: new signups, first-user-becomes-super_admin bootstrap, role changes.
-- DELETE is covered by ON DELETE CASCADE foreign key.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_user_role_to_lookup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert into user_roles whenever a profile is created or role changes
  INSERT INTO public.user_roles (user_id, role, updated_at)
  VALUES (NEW.id, NEW.role, now())
  ON CONFLICT (user_id) DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop trigger if exists to avoid duplicate
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.profiles;

-- Create trigger for INSERT and UPDATE OF role
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_to_lookup();

-- -----------------------------------------------------------------------------
-- STEP 5: Replace helper functions to query user_roles instead of profiles
-- CREATE OR REPLACE only - no DROP FUNCTION, no CASCADE
-- All signatures remain identical
-- -----------------------------------------------------------------------------

-- current_role() - now queries user_roles
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid())
$$;

-- is_admin() - now queries user_roles
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

-- is_hr_or_admin() - now queries user_roles
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

-- is_direct_report() - stays on profiles (manager_id lives there)
-- With profiles policies fixed, this no longer recurses
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
-- These now call the rewritten helpers which query user_roles, not profiles
-- -----------------------------------------------------------------------------

-- Drop the three problematic policies
DROP POLICY IF EXISTS "super_admin_full_access" ON public.profiles;
DROP POLICY IF EXISTS "hr_manager_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "hr_manager_update_profiles" ON public.profiles;

-- Recreate using updated helper functions (no recursion now)
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

-- -----------------------------------------------------------------------------
-- VERIFICATION QUERIES (run manually after migration)
-- -----------------------------------------------------------------------------
-- (a) Row count match:
--     SELECT (SELECT count(*) FROM user_roles) AS user_roles_count,
--            (SELECT count(*) FROM profiles) AS profiles_count;
--
-- (b) Profile fetch succeeds (no recursion):
--     SELECT * FROM public.profiles WHERE id = auth.uid();
--
-- (c) Check policies exist:
--     SELECT policyname FROM pg_policies 
--     WHERE schemaname = 'public' AND tablename = 'profiles';
--
-- (d) Test trigger sync - update a role and verify:
--     UPDATE profiles SET role = 'hr_manager' WHERE id = '<some_user_id>';
--     SELECT * FROM user_roles WHERE user_id = '<some_user_id>';
-- =============================================================================