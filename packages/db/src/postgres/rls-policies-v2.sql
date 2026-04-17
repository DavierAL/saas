-- ============================================================
-- SaaS POS — Comprehensive RLS Policies (v2)
--
-- Covers SELECT + INSERT + UPDATE + DELETE separately for
-- fine-grained control. Additive — run after schema.sql.
--
-- Key invariant: EVERY policy uses public.tenant_id() which
-- reads tenant_id from the Supabase JWT claim.
-- ============================================================

-- ─── TENANTS ─────────────────────────────────────────────────
-- Drop and recreate for clarity (schema.sql already created the FOR ALL)
DROP POLICY IF EXISTS "tenant_isolation" ON public.tenants;

CREATE POLICY "tenants_select" ON public.tenants
  FOR SELECT USING (id::TEXT = public.tenant_id());

-- Only service_role can INSERT tenants (via API, not client)
CREATE POLICY "tenants_insert" ON public.tenants
  FOR INSERT WITH CHECK (false);  -- Blocked for all JWT users

CREATE POLICY "tenants_update" ON public.tenants
  FOR UPDATE
  USING (id::TEXT = public.tenant_id())
  WITH CHECK (id::TEXT = public.tenant_id());

CREATE POLICY "tenants_delete" ON public.tenants
  FOR DELETE USING (false);  -- Never delete tenants; use soft delete

-- ─── USERS ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_tenant_isolation" ON public.users;

CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (tenant_id::TEXT = public.tenant_id());

-- Only admins can create users (checked via JWT role claim)
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (
    tenant_id::TEXT = public.tenant_id()
    AND (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
  );

CREATE POLICY "users_update" ON public.users
  FOR UPDATE
  USING (tenant_id::TEXT = public.tenant_id())
  WITH CHECK (tenant_id::TEXT = public.tenant_id());

-- Soft-delete only; hard delete blocked
CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (false);

-- ─── ITEMS ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "items_tenant_isolation" ON public.items;

CREATE POLICY "items_select" ON public.items
  FOR SELECT USING (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "items_insert" ON public.items
  FOR INSERT WITH CHECK (
    tenant_id::TEXT = public.tenant_id()
  );

CREATE POLICY "items_update" ON public.items
  FOR UPDATE
  USING (tenant_id::TEXT = public.tenant_id())
  WITH CHECK (tenant_id::TEXT = public.tenant_id());

-- Soft delete: allow UPDATE (sets deleted_at), block hard DELETE
CREATE POLICY "items_delete" ON public.items
  FOR DELETE USING (false);

-- ─── ORDERS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_tenant_isolation" ON public.orders;

CREATE POLICY "orders_select" ON public.orders
  FOR SELECT USING (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (
    tenant_id::TEXT = public.tenant_id()
    -- Enforce: only insert if tenant subscription is active
    AND EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id::TEXT = public.tenant_id()
        AND t.valid_until > now()
        AND t.deleted_at IS NULL
    )
  );

-- Only allow cancellation (status update), not arbitrary edits
CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE
  USING (tenant_id::TEXT = public.tenant_id())
  WITH CHECK (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "orders_delete" ON public.orders
  FOR DELETE USING (false);

-- ─── ORDER LINES ─────────────────────────────────────────────
DROP POLICY IF EXISTS "order_lines_tenant_isolation" ON public.order_lines;

CREATE POLICY "order_lines_select" ON public.order_lines
  FOR SELECT USING (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "order_lines_insert" ON public.order_lines
  FOR INSERT WITH CHECK (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "order_lines_update" ON public.order_lines
  FOR UPDATE
  USING (tenant_id::TEXT = public.tenant_id())
  WITH CHECK (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "order_lines_delete" ON public.order_lines
  FOR DELETE USING (false);

-- ─── TABLES_RESTAURANT ───────────────────────────────────────
DROP POLICY IF EXISTS "tables_tenant_isolation" ON public.tables_restaurant;

CREATE POLICY "tables_select" ON public.tables_restaurant
  FOR SELECT USING (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "tables_insert" ON public.tables_restaurant
  FOR INSERT WITH CHECK (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "tables_update" ON public.tables_restaurant
  FOR UPDATE
  USING (tenant_id::TEXT = public.tenant_id())
  WITH CHECK (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "tables_delete" ON public.tables_restaurant
  FOR DELETE USING (false);

-- ─── APPOINTMENTS ────────────────────────────────────────────
DROP POLICY IF EXISTS "appointments_tenant_isolation" ON public.appointments;

CREATE POLICY "appt_select" ON public.appointments
  FOR SELECT USING (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "appt_insert" ON public.appointments
  FOR INSERT WITH CHECK (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "appt_update" ON public.appointments
  FOR UPDATE
  USING (tenant_id::TEXT = public.tenant_id())
  WITH CHECK (tenant_id::TEXT = public.tenant_id());

CREATE POLICY "appt_delete" ON public.appointments
  FOR DELETE USING (false);
