-- ============================================================
-- Supabase Auth Setup
--
-- Injects tenant_id into JWT so PowerSync and RLS can use it.
-- Run ONCE after schema.sql in the Supabase SQL editor.
-- ============================================================

-- ─── 1. Link auth.users → tenants via a mapping table ────────
-- This table maps a Supabase auth user UUID to their tenant.
CREATE TABLE IF NOT EXISTS public.tenant_members (
  auth_user_id  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  role          TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier', 'waiter')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON public.tenant_members(tenant_id);

-- No RLS needed: this table is only read by the hook below (service_role context)

-- ─── 2. JWT Customization Hook (Versión SQL Puro) ────────────
-- Esta versión no usa variables internas ni bloques DECLARE,
-- evitando errores de parsing en editores que dividen por ';'.
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $body$
  SELECT jsonb_set(
    event,
    '{claims}',
    (event->'claims') || COALESCE(
      (
        SELECT jsonb_build_object(
          'tenant_id', tenant_id::text,
          'role', role
        )
        FROM public.tenant_members
        WHERE auth_user_id = (event->>'user_id')::uuid
      ),
      jsonb_build_object('tenant_id', null, 'role', 'none')
    )
  );
$body$;

-- Grant permissions for the hook to run under service_role
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ─── 3. Register hook in Supabase Dashboard ──────────────────
-- After running this SQL, go to:
-- Supabase Dashboard → Authentication → Hooks
-- Add hook: "Customize Access Token (JWT) Claim"
-- Function: public.custom_access_token_hook

-- ─── 4. Helper: Onboard a new tenant + admin user ────────────
-- Call this from your backend (with service_role key) when a
-- new business signs up.
CREATE OR REPLACE FUNCTION public.onboard_tenant(
  p_tenant_name     TEXT,
  p_industry_type   TEXT,
  p_auth_user_id    UUID,
  p_valid_days      INT DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs as superuser to bypass RLS
AS $$
DECLARE
  v_tenant_id UUID;
  v_sanitized_name TEXT;
BEGIN
  -- [AUTH-003] Defensive valid_days bounds
  IF p_valid_days < 1 OR p_valid_days > 365 THEN
    RAISE EXCEPTION 'p_valid_days must be between 1 and 365. Received: %', p_valid_days;
  END IF;

  -- [AUTH-003] Sanitization: Allow safe characters like accents, spaces, commas and dots.
  v_sanitized_name := regexp_replace(p_tenant_name, '[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ .,-]', '', 'g');
  IF trim(v_sanitized_name) = '' THEN
    RAISE EXCEPTION 'Tenant name is invalid after security sanitization.';
  END IF;

  -- [AUTH-003] Rate limiting: Max 1 onboard request per minute per user
  IF EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE auth_user_id = p_auth_user_id
      AND created_at > (now() - interval '1 minute')
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait a minute before creating another tenant.';
  END IF;

  -- Create tenant
  INSERT INTO public.tenants (name, industry_type, valid_until)
  VALUES (
    v_sanitized_name,
    p_industry_type,
    now() + (p_valid_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_tenant_id;

  -- Link the admin user to this tenant
  INSERT INTO public.tenant_members (auth_user_id, tenant_id, role)
  VALUES (p_auth_user_id, v_tenant_id, 'admin');

  RETURN v_tenant_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.onboard_tenant FROM authenticated, anon;
GRANT  EXECUTE ON FUNCTION public.onboard_tenant TO service_role;
