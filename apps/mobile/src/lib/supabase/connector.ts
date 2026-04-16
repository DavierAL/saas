/**
 * Supabase PowerSync Connector
 *
 * Implements PowerSyncBackendConnector to:
 *   1. fetchCredentials → get Supabase JWT for PowerSync auth
 *   2. uploadData → push local SQLite mutations to Supabase REST API
 *
 * All writes go through Supabase RLS, which enforces tenant isolation.
 */
import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  CrudEntry,
  UpdateType,
} from '@powersync/react-native';
import { supabase } from './client';

const POWERSYNC_URL = process.env.EXPO_PUBLIC_POWERSYNC_URL ?? '';

export class SupabaseConnector implements PowerSyncBackendConnector {
  /**
   * Called by PowerSync to get the endpoint URL and auth token.
   * PowerSync verifies the Supabase JWT to determine which
   * bucket_definitions apply to this user.
   */
  async fetchCredentials() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    if (!session) throw new Error('No active session. Please log in.');

    return {
      endpoint: POWERSYNC_URL,
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  }

  /**
   * Called by PowerSync to upload queued local writes to the backend.
   * Implements idempotent upserts using Supabase's onConflict option.
   *
   * Strategy: Outbox pattern — mutations are queued locally and
   * uploaded when network is available. Each operation is retry-safe.
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    let lastEntry: CrudEntry | undefined;

    try {
      for (const entry of transaction.crud) {
        lastEntry = entry;

        const table = entry.table;
        const id = entry.id;

        switch (entry.op) {
          case UpdateType.PUT: {
            // Upsert: handles both INSERT and UPDATE
            const { error } = await supabase
              .from(table)
              .upsert({ id, ...entry.opData }, { onConflict: 'id' });
            if (error) throw error;
            break;
          }

          case UpdateType.PATCH: {
            const { error } = await supabase
              .from(table)
              .update(entry.opData ?? {})
              .eq('id', id);
            if (error) throw error;
            break;
          }

          case UpdateType.DELETE: {
            // Use soft delete: set deleted_at instead of hard delete
            const { error } = await supabase
              .from(table)
              .update({ deleted_at: new Date().toISOString() })
              .eq('id', id);
            if (error) throw error;
            break;
          }
        }
      }

      await transaction.complete();
    } catch (error) {
      console.error(
        `[SupabaseConnector] uploadData failed at entry ${lastEntry?.id}:`,
        error,
      );
      throw error; // PowerSync will retry the transaction
    }
  }
}
