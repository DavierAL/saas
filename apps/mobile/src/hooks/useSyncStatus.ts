/**
 * useSyncStatus — reactive hook for PowerSync sync state.
 *
 * Returns:
 *   - status: 'connected' | 'connecting' | 'disconnected' | 'error'
 *   - lastSyncedAt: ISO string or null
 *   - hasSynced: boolean (has ever completed a full sync)
 */
import { usePowerSyncStatus } from '@powersync/react-native';

export type SyncStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  hasSynced: boolean;
}

export const useSyncStatus = (): SyncState => {
  const status = usePowerSyncStatus();

  const syncStatus: SyncStatus = status.connected
    ? 'connected'
    : status.connecting
    ? 'connecting'
    : 'disconnected';

  return {
    status: syncStatus,
    lastSyncedAt: status.lastSyncedAt?.toISOString() ?? null,
    hasSynced: status.hasSynced ?? false,
  };
};
