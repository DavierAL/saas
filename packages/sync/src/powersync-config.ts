/**
 * PowerSync configuration placeholder.
 * Will be populated in Phase 1 when we integrate PowerSync.
 *
 * Strategy:
 * - SQLite (client) is source of truth for UI
 * - PostgreSQL (cloud) is replicated state
 * - PowerSync handles bidirectional sync via WebSockets
 * - Conflict resolution: last-write-wins with tenant_id scoping
 */

export interface PowerSyncConfig {
  readonly backendUrl: string;
  readonly powersyncUrl: string;
}

export const createPowerSyncConfig = (
  backendUrl: string,
  powersyncUrl: string,
): PowerSyncConfig => ({
  backendUrl,
  powersyncUrl,
});
