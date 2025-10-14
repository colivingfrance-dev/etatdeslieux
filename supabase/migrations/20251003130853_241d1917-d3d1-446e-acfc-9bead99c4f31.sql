-- Fix security issue: Remove duplicate RLS policies from different schemas
-- The locataires table has duplicate policies in both global_data and public schemas

-- Drop the old policies from global_data schema
DROP POLICY IF EXISTS "Locataires delete own" ON global_data.locataires;
DROP POLICY IF EXISTS "Locataires insert own" ON global_data.locataires;
DROP POLICY IF EXISTS "Locataires select own" ON global_data.locataires;
DROP POLICY IF EXISTS "Locataires update own" ON global_data.locataires;

-- The policies in public schema are already correct and secure:
-- - Superadmins can manage all tenant records (for oversight)
-- - Owners can only access their own tenant records (created_by = auth.uid())
-- These policies properly protect sensitive PII data