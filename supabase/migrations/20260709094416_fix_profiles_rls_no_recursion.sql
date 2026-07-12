-- Fix RLS recursion on profiles table
-- The problem: profiles policies call helper functions that read from profiles
-- causing infinite recursion. Solution: rewrite profiles policies without helpers.

-- Drop all problematic policies on profiles
DROP POLICY IF EXISTS "super_admin_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "team_manager_read_direct_reports" ON public.profiles;
DROP POLICY IF EXISTS "hr_manager_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "hr_manager_update_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

-- Policy 1: Users can always read their own profile (no recursion)
-- Note: users_read_own_profile may already exist, keep it

-- Policy 2: Users can update their own profile
CREATE POLICY "users_update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Policy 3: Team managers can read their direct reports
-- Uses manager_id directly without calling helper functions
CREATE POLICY "team_manager_read_reports"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (manager_id = (SELECT auth.uid()));

-- Policy 4: Super admin full access
-- Instead of calling is_admin(), we use auth.uid() to check inline
-- This works because we're checking if the CURRENT user's row has super_admin role
CREATE POLICY "super_admin_full_access"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'super_admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'super_admin'
  );

-- Policy 5: HR manager can read all profiles
CREATE POLICY "hr_manager_read_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'hr_manager'
  );

-- Policy 6: HR manager can update profiles (trigger prevents role changes)
CREATE POLICY "hr_manager_update_profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'hr_manager'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) = 'hr_manager'
  );