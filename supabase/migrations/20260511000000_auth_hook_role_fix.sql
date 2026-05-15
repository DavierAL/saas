-- ============================================================
-- Fix: Actualizar custom_access_token_hook
-- para inyectar 'role' y 'tenant_id' desde tenant_members
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
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
        WHERE auth_user_id = (event->'claims'->>'sub')::uuid
      ),
      jsonb_build_object('tenant_id', null, 'role', event->'claims'->>'role')
    )
  );
$body$;

-- Permisos (reemplazar los grants de la versión vieja)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Crear roles de Postgres para que PostgREST pueda asumirlos
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin NOLOGIN;
    GRANT authenticated TO admin;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cashier') THEN
    CREATE ROLE cashier NOLOGIN;
    GRANT authenticated TO cashier;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'waiter') THEN
    CREATE ROLE waiter NOLOGIN;
    GRANT authenticated TO waiter;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'barber') THEN
    CREATE ROLE barber NOLOGIN;
    GRANT authenticated TO barber;
  END IF;
END
$$;

-- Grant permissions so authenticator can switch to these roles
GRANT admin, cashier, waiter, barber TO authenticator;

-- Ensure these roles have access to the public schema
GRANT USAGE ON SCHEMA public TO admin, cashier, waiter, barber;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin, cashier, waiter, barber;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin, cashier, waiter, barber;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO admin, cashier, waiter, barber;

