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
    sql: 'ALTER TABLE orders ADD COLUMN customer_name TEXT;' 
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
