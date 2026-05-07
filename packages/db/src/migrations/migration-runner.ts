/**
 * Local SQLite migration runner.
 * Implements additive-only schema evolution with version tracking.
 *
 * Strategy: Never break old schemas. Always additive migrations.
 * The app checks schemaVersion on startup and runs pending migrations.
 */

export interface Migration {
  readonly version: number;
  readonly description: string;
  readonly sql: string;
}

export interface MigrationDatabase {
  execute(sql: string): Promise<void>;
  getSchemaVersion(): Promise<number>;
  setSchemaVersion(version: number): Promise<void>;
}

// Register all migrations here in order
export const MIGRATIONS: readonly Migration[] = [
  // Migration v1 is the initial schema (applied via SQLITE_SCHEMA)
  {
    version: 2,
    description: 'Add customer_name to orders',
    sql: 'ALTER TABLE orders ADD COLUMN customer_name TEXT;',
  },
  // [ADR-003] Sync schema with Supabase production (2026-05-05)
  {
    version: 3,
    description: 'Add tenant_id to order_lines for PowerSync sync rules',
    sql: "ALTER TABLE order_lines ADD COLUMN tenant_id TEXT NOT NULL DEFAULT '' REFERENCES tenants(id);",
  },
  {
    version: 4,
    description: 'Add last_remote_validation_at to tenants for offline paywall tracking',
    sql: 'ALTER TABLE tenants ADD COLUMN last_remote_validation_at TEXT;',
  },
  {
    version: 5,
    description: 'Add currency to orders for reporting without tenant joins',
    sql: "ALTER TABLE orders ADD COLUMN currency TEXT NOT NULL DEFAULT 'PEN';",
  },
];

export const runMigrations = async (db: MigrationDatabase): Promise<number> => {
  const currentVersion = await db.getSchemaVersion();
  const pendingMigrations = MIGRATIONS.filter((m) => m.version > currentVersion);

  for (const migration of pendingMigrations) {
    await db.execute(migration.sql);
    await db.setSchemaVersion(migration.version);
  }

  return pendingMigrations.length;
};
