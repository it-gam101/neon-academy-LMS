-- Create profiles table extending auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin', 'hr_manager', 'team_manager', 'instructor', 'employee')),
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department TEXT,
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'he')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for foreign keys and common queries
CREATE INDEX idx_profiles_manager_id ON public.profiles(manager_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_department ON public.profiles(department);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Users can update their own profile but NOT role or manager_id
-- We achieve this by only allowing update of specific columns via a function
CREATE POLICY "Users can update own profile except role and manager_id"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id
  );

-- Trigger function to auto-create profile on signup (SECURITY DEFINER allowed for auth.users triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to run on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to prevent role/manager_id updates by non-admins (run as trigger before update)
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Only allow if the current user is a super_admin or hr_manager
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('super_admin', 'hr_manager')
    ) THEN
      NEW.role := OLD.role; -- Revert the change
    END IF;
  END IF;
  
  -- If manager_id is being changed
  IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
    -- Only allow if the current user is a super_admin or hr_manager
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('super_admin', 'hr_manager')
    ) THEN
      NEW.manager_id := OLD.manager_id; -- Revert the change
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to protect role and manager_id fields
CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();