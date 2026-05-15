-- ============================================================
-- Fix: Ensure barbershop admin exists in both tenant_members
-- and users tables so they can create new users.
--
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Check if your tenant admin exists in tenant_members
-- (Replace 'your-barbershop@example.com' with the admin's email)
SELECT
  tm.auth_user_id,
  tm.tenant_id,
  tm.role as tenant_members_role,
  u.id is not null  as exists_in_users_table,
  u.role as users_table_role,
  u.email
FROM public.tenant_members tm
LEFT JOIN public.users u ON u.email = 'your-barbershop@example.com'
WHERE tm.role = 'admin'
ORDER BY tm.created_at DESC
LIMIT 5;

-- 2. If the admin is NOT in the users table, run this:
-- (Replace values as needed)
DO $$
DECLARE
  v_auth_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Find the auth_user_id for the barbershop admin
  SELECT au.id, tm.tenant_id
  INTO v_auth_id, v_tenant_id
  FROM auth.users au
  JOIN public.tenant_members tm ON tm.auth_user_id = au.id
  WHERE au.email = 'your-barbershop@example.com'
    AND tm.role = 'admin'
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    RAISE NOTICE 'Admin user not found. Check email.';
    RETURN;
  END IF;

  -- Check if already in users table
  IF EXISTS (SELECT 1 FROM public.users WHERE email = 'your-barbershop@example.com') THEN
    RAISE NOTICE 'Admin already exists in users table.';
  ELSE
    -- Insert admin into users table (app-level)
    INSERT INTO public.users (id, email, role, tenant_id)
    VALUES (v_auth_id, 'your-barbershop@example.com', 'admin', v_tenant_id);
    RAISE NOTICE 'Admin inserted into users table.';
  END IF;
END;
$$;
