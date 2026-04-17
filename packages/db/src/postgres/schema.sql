-- ============================================================
-- SaaS POS — PostgreSQL Schema (Supabase)
-- Strategy: Additive-only migrations. Never drop columns/tables.
-- All tables are tenant-scoped with RLS enforcement.
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------
-- HELPER: Extract tenant_id from Supabase JWT claim
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tenant_id() RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'tenant_id',
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'tenant_id')
  );
$$ LANGUAGE SQL STABLE;

-- ============================================================
-- TABLE: tenants
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  industry_type   TEXT NOT NULL CHECK (industry_type IN ('restaurant', 'barbershop', 'retail')),
  modules_config  JSONB NOT NULL DEFAULT '{"has_inventory": true, "has_tables": false, "has_appointments": false}',
  valid_until     TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Tenants RLS: a user can only see their own tenant
CREATE POLICY "tenant_isolation" ON public.tenants
  FOR ALL USING (id::TEXT = public.tenant_id());

-- ============================================================
-- TABLE: users  (employees / cashiers)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier', 'waiter')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_tenant_isolation" ON public.users
  FOR ALL USING (tenant_id::TEXT = public.tenant_id());

-- ============================================================
-- TABLE: items  (products + services — Single Table Inheritance)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  type        TEXT NOT NULL CHECK (type IN ('product', 'service')),
  name        TEXT NOT NULL,
  -- price stored as integer cents (e.g. S/ 10.50 = 1050)
  -- avoids floating-point precision issues
  price       INTEGER NOT NULL CHECK (price >= 0),
  stock       INTEGER CHECK (stock >= 0),  -- NULL for services
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_items_tenant_id ON public.items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_items_type     ON public.items(type);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items_tenant_isolation" ON public.items
  FOR ALL USING (tenant_id::TEXT = public.tenant_id());

-- ============================================================
-- TABLE: orders  (transaction headers)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  user_id       UUID NOT NULL REFERENCES public.users(id)   ON DELETE RESTRICT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'paid', 'cancelled')),
  total_amount  INTEGER NOT NULL CHECK (total_amount >= 0),  -- integer cents
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created   ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_tenant_isolation" ON public.orders
  FOR ALL USING (tenant_id::TEXT = public.tenant_id());

-- ============================================================
-- TABLE: order_lines  (transaction detail — no tenant_id needed,
--   access is scoped through the parent order's RLS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_lines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES public.items(id)  ON DELETE RESTRICT,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  INTEGER NOT NULL CHECK (unit_price >= 0),  -- snapshot in cents
  subtotal    INTEGER NOT NULL CHECK (subtotal >= 0),     -- quantity * unit_price
  -- tenant_id denormalized for PowerSync sync rules (avoids joins)
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_order_lines_order_id   ON public.order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_tenant_id  ON public.order_lines(tenant_id);

ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_lines_tenant_isolation" ON public.order_lines
  FOR ALL USING (tenant_id::TEXT = public.tenant_id());

-- ============================================================
-- MODULE: tables_restaurant  (optional — enabled via modules_config)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tables_restaurant (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  table_number INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'occupied')),
  UNIQUE(tenant_id, table_number)
);

CREATE INDEX IF NOT EXISTS idx_tables_tenant ON public.tables_restaurant(tenant_id);

ALTER TABLE public.tables_restaurant ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tables_tenant_isolation" ON public.tables_restaurant
  FOR ALL USING (tenant_id::TEXT = public.tenant_id());

-- ============================================================
-- MODULE: appointments  (optional — barbershops)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  item_id       UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  start_time    TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'done', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_appt_tenant ON public.appointments(tenant_id);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_tenant_isolation" ON public.appointments
  FOR ALL USING (tenant_id::TEXT = public.tenant_id());

-- ============================================================
-- AUTO-UPDATE: updated_at trigger (applied to all tables with it)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_items_updated_at
    BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- ============================================================
-- SOFT DELETE: Ensure server-side timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- If deleted_at is being set from NULL to something else,
  -- always force server-side now() to prevent client clock drift.
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    NEW.deleted_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_tenants_soft_delete
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.handle_soft_delete();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_users_soft_delete
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_soft_delete();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_items_soft_delete
    BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION public.handle_soft_delete();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_orders_soft_delete
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_soft_delete();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
