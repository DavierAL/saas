/**
 * SQLite schema definitions.
 * These are the CREATE TABLE statements for the local database.
 * Every table includes tenant_id for strict multi-tenancy.
 */

export const SCHEMA_VERSION = 1;

export const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    industry_type TEXT NOT NULL CHECK(industry_type IN ('restaurant', 'barbershop', 'retail')),
    modules_config TEXT NOT NULL DEFAULT '{}',
    valid_until TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'cashier', 'waiter')),
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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled')),
    total_amount INTEGER NOT NULL,
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
    subtotal INTEGER NOT NULL
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
    customer_name TEXT NOT NULL,
    item_id TEXT NOT NULL REFERENCES items(id),
    start_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'done', 'cancelled'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_items_tenant ON items(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines(order_id);
`;
