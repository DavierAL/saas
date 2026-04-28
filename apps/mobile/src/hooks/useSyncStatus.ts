/**
 * useSyncStatus — reactive hook for PowerSync sync state.
 *
 * Safe to call even before PowerSync is initialized — returns
 * 'disconnected' state instead of crashing.
 */
import { usePowerSyncStatus } from '@powersync/react-native';

export type SyncStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  hasSynced: boolean;
}

const DISCONNECTED: SyncState = {
  status: 'disconnected',
  lastSyncedAt: null,
  hasSynced: false,
};

export const useSyncStatus = (): SyncState => {
  // usePowerSyncStatus throws if PowerSyncContext is not mounted.
  // This happens during the brief window before DatabaseProvider initializes
  // (e.g., when AuthGuard hasn't redirected yet or DB is still loading).
  let status;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    status = usePowerSyncStatus();
  } catch {
    return DISCONNECTED;
  }

  if (!status) return DISCONNECTED;

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
