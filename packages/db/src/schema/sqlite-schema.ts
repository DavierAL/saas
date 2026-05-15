/**
 * SQLite schema definitions.
 * These are the CREATE TABLE statements for the local database.
 * Every table includes tenant_id for strict multi-tenancy.
 *
 * SYNC CONTRACT: This schema must mirror the Supabase (PostgreSQL) schema
 * for all columns that PowerSync replicates. Non-replicated columns
 * (e.g. password_hash) are intentionally excluded from SQLite.
 *
 * Last synced with Supabase: 2026-05-05 (ADR-003)
 */

export const SCHEMA_VERSION = 1;

export const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    industry_type TEXT NOT NULL CHECK(industry_type IN ('restaurant', 'barbershop', 'retail')),
    modules_config TEXT NOT NULL DEFAULT '{}',
    valid_until TEXT NOT NULL,
    -- [ADR-003] Tenant currency for multi-region POS support
    currency TEXT NOT NULL DEFAULT 'PEN',
    -- [ADR-003] Tracks last server-side subscription validation (offline paywall)
    last_remote_validation_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    email TEXT NOT NULL UNIQUE,
    -- NOTE: password_hash is intentionally excluded from SQLite (security: no hash on device)
    role TEXT NOT NULL CHECK(role IN ('admin', 'cashier', 'waiter', 'barber')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    type TEXT NOT NULL CHECK(type IN ('product', 'service')),
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER,
    duration_minutes INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    customer_id TEXT REFERENCES customers(id),
    -- [ADR-003] Optional customer name for order attribution / receipts
    customer_name TEXT,
    -- [ADR-003] Full state machine aligned with domain/entities/order.ts
    --   pending -> paid | cancelled | voided
    --   paid    -> refunded | partially_refunded
    --   cancelled, refunded, partially_refunded, voided -> (terminal)
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending', 'paid', 'cancelled', 'refunded', 'partially_refunded', 'voided')),
    total_amount INTEGER NOT NULL,
    tip_amount INTEGER NOT NULL DEFAULT 0,
    -- [ADR-003] Tenant currency (denormalized for reporting without joins to tenants)
    currency TEXT NOT NULL DEFAULT 'PEN',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS order_lines (
    id TEXT PRIMARY KEY NOT NULL,
    order_id TEXT NOT NULL REFERENCES orders(id),
    item_id TEXT NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    -- tenant_id denormalized for PowerSync sync rules (avoids joins)
    tenant_id TEXT NOT NULL REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS tables_restaurant (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    table_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'free' CHECK(status IN ('free', 'occupied'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    customer_id TEXT REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    item_id TEXT NOT NULL REFERENCES items(id),
    barber_id TEXT REFERENCES users(id),
    duration_minutes INTEGER DEFAULT 30,
    start_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'done', 'cancelled'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_items_tenant ON items(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines(order_id);
  CREATE INDEX IF NOT EXISTS idx_order_lines_tenant ON order_lines(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
`;
