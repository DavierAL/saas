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

// Singleton instances
let _db: PowerSyncDatabase | null = null;
let _connector: SupabaseConnector | null = null;
let _initialized = false;
let _initPromise: Promise<PowerSyncDatabase> | null = null;

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
 * Idempotent and concurrency-safe: safe to call multiple times simultaneously.
 */
export const initDatabase = async (): Promise<PowerSyncDatabase> => {
  if (_initialized) return getDatabase();
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const db = getDatabase();
      const connector = getConnector();
      
      console.log('[PowerSync] Starting initialization...');
      await db.init();
      
      console.log('[PowerSync] Connecting to backend...');
      await db.connect(connector);
      
      _initialized = true;
      console.log('[PowerSync] Initialization complete.');
      return db;
    } catch (error) {
      _initPromise = null; // Allow retry on failure
      console.error('[PowerSync] Initialization failed:', error);
      throw error;
    }
  })();

  return _initPromise;
};
