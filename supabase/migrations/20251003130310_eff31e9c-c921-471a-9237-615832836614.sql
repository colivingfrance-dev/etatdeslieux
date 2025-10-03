-- Fix security issue: Tenant Personal Information Could Be Stolen by Hackers
-- This migration removes duplicate RLS policies and ensures proper access control

-- Drop all existing duplicate policies on locataires table
DROP POLICY IF EXISTS "Locataires delete by owner" ON public.locataires;
DROP POLICY IF EXISTS "Locataires insert by owner" ON public.locataires;
DROP POLICY IF EXISTS "Locataires select by owner" ON public.locataires;
DROP POLICY IF EXISTS "Locataires update by owner" ON public.locataires;
DROP POLICY IF EXISTS "Locataires delete own" ON public.locataires;
DROP POLICY IF EXISTS "Locataires insert own" ON public.locataires;
DROP POLICY IF EXISTS "Locataires select own" ON public.locataires;
DROP POLICY IF EXISTS "Locataires update own" ON public.locataires;

-- Create clean, secure policies for the locataires table
-- Superadmins can view all tenant data (for oversight and management)
CREATE POLICY "Superadmins can view all tenant records"
ON public.locataires
FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Superadmins can manage all tenant data
CREATE POLICY "Superadmins can insert tenant records"
ON public.locataires
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can update tenant records"
ON public.locataires
FOR UPDATE
USING (public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can delete tenant records"
ON public.locataires
FOR DELETE
USING (public.has_role(auth.uid(), 'superadmin'::app_role));

-- Property owners can view their own tenant records
CREATE POLICY "Owners can view their tenant records"
ON public.locataires
FOR SELECT
USING (auth.uid() = created_by);

-- Property owners can create their own tenant records
CREATE POLICY "Owners can insert their tenant records"
ON public.locataires
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Property owners can update their own tenant records
CREATE POLICY "Owners can update their tenant records"
ON public.locataires
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Property owners can delete their own tenant records
CREATE POLICY "Owners can delete their tenant records"
ON public.locataires
FOR DELETE
USING (auth.uid() = created_by);