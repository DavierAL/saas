-- ============================================================
-- Fix: Add RLS policies for tenants table
-- Date: 2026-05-11
-- Description: Allow authenticated users to read/write their tenant's data
-- ============================================================

BEGIN;

-- Ensure RLS is enabled (should already be, but just in case)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT their tenant's record
-- Uses the JWT claim 'tenant_id' injected by custom_access_token_hook
CREATE POLICY "Users can view their tenant"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id') = id::text
    OR
    (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id') IS NOT NULL
    AND id = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid
  );

-- Policy: Users can INSERT new tenant records (only admins can create tenants)
CREATE POLICY "Admins can insert tenant"
  ON tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb->>'role') IN ('admin')
  );

-- Policy: Users can UPDATE their tenant's record
CREATE POLICY "Users can update their tenant"
  ON tenants
  FOR UPDATE
  TO authenticated
  USING (
    id = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid
  )
  WITH CHECK (
    id = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid
  );

-- Policy: Users can DELETE their tenant (admin only)
CREATE POLICY "Admins can delete tenant"
  ON tenants
  FOR DELETE
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::jsonb->>'role') IN ('admin')
    AND id = (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid
  );

COMMIT;