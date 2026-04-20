-- ============================================================
-- SQL: Fix RLS for Tenants table
-- Allows 'anon' role to read tenants, resolving potential 401/42501 errors.
-- ============================================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow anyone to READ tenants
-- (In a real app, you might restrict this, but for POS lookup it's usually public)
DROP POLICY IF EXISTS "Allow public read access" ON public.tenants;

CREATE POLICY "Allow public read access"
ON public.tenants
FOR SELECT
TO anon
USING (true);

-- 3. Repeat for items if necessary (optional but recommended)
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.items;
CREATE POLICY "Allow public read access" ON public.items FOR SELECT TO anon USING (true);
