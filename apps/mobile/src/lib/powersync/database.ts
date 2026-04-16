/**
 * PowerSync Database Singleton
 *
 * Creates and exports the single PowerSyncDatabase instance.
 * This is the ONLY database object the app uses for all reads/writes.
 *
 * Architecture decision:
 *   - Singleton pattern ensures one SQLite connection app-wide
 *   - AppSchema defines all tables PowerSync manages
 *   - SupabaseConnector handles auth + upload
 */
import { PowerSyncDatabase } from '@powersync/react-native';
import { AppSchema } from '@saas-pos/sync';
import { SupabaseConnector } from '../supabase/connector';

// Singleton instance
let _db: PowerSyncDatabase | null = null;
let _connector: SupabaseConnector | null = null;

export const getDatabase = (): PowerSyncDatabase => {
  if (!_db) {
    _db = new PowerSyncDatabase({
      schema: AppSchema,
      database: {
        dbFilename: 'saas-pos.db',
      },
    });
  }
  return _db;
};

export const getConnector = (): SupabaseConnector => {
  if (!_connector) {
    _connector = new SupabaseConnector();
  }
  return _connector;
};

/**
 * Initialize the database and start syncing.
 * Call once on app startup inside the DatabaseProvider.
 */
export const initDatabase = async (): Promise<PowerSyncDatabase> => {
  const db = getDatabase();
  const connector = getConnector();
  await db.init();
  await db.connect(connector);
  return db;
};
