-- Create role enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'client');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create admin_profiles table for tracking admin quotas and relationships
CREATE TABLE public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  max_locations INTEGER DEFAULT 5 NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Add admin_id to inspections to track which admin manages this client
ALTER TABLE public.inspections 
ADD COLUMN admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create function to count admin's locations
CREATE OR REPLACE FUNCTION public.count_admin_locations(_admin_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT user_id)::INTEGER
  FROM public.inspections
  WHERE admin_id = _admin_id
$$;

-- Migrate existing users to client role
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'client'::app_role
FROM public.inspections
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for admin_profiles
CREATE POLICY "Admins can view their own profile"
ON public.admin_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all admin profiles"
ON public.admin_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can insert admin profiles"
ON public.admin_profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can update admin profiles"
ON public.admin_profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete admin profiles"
ON public.admin_profiles FOR DELETE
USING (public.has_role(auth.uid(), 'superadmin'));

-- Update inspections RLS policies
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres inspections" ON public.inspections;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres inspections" ON public.inspections;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres inspections" ON public.inspections;

-- Clients can view their own inspections
CREATE POLICY "Clients can view their own inspections"
ON public.inspections FOR SELECT
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'client'));

-- Admins can view inspections of their clients
CREATE POLICY "Admins can view their clients inspections"
ON public.inspections FOR SELECT
USING (auth.uid() = admin_id AND public.has_role(auth.uid(), 'admin'));

-- Superadmins can view all inspections
CREATE POLICY "Superadmins can view all inspections"
ON public.inspections FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'));

-- Clients can create their own inspections (with admin assignment)
CREATE POLICY "Clients can create their own inspections"
ON public.inspections FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'client'));

-- Admins can create inspections for their clients
CREATE POLICY "Admins can create inspections for clients"
ON public.inspections FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') AND
  auth.uid() = admin_id AND
  public.count_admin_locations(auth.uid()) < (
    SELECT max_locations FROM public.admin_profiles WHERE user_id = auth.uid()
  )
);

-- Superadmins can create any inspection
CREATE POLICY "Superadmins can create any inspection"
ON public.inspections FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Clients can update their own inspections
CREATE POLICY "Clients can update their own inspections"
ON public.inspections FOR UPDATE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'client'));

-- Admins can update their clients inspections
CREATE POLICY "Admins can update their clients inspections"
ON public.inspections FOR UPDATE
USING (auth.uid() = admin_id AND public.has_role(auth.uid(), 'admin'));

-- Superadmins can update any inspection
CREATE POLICY "Superadmins can update any inspection"
ON public.inspections FOR UPDATE
USING (public.has_role(auth.uid(), 'superadmin'));

-- Trigger for admin_profiles updated_at
CREATE TRIGGER update_admin_profiles_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create the superadmin user (will need to be created in Supabase Auth first)
-- This is a placeholder - the actual user needs to be created via Supabase Auth
-- Then run: INSERT INTO public.user_roles (user_id, role) VALUES ('[superadmin-uuid]', 'superadmin');