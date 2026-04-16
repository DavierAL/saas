/**
 * useItems — reactive hook for catalog items.
 *
 * This is the "Hello World" of Local-First:
 *   - Reads directly from SQLite (zero latency)
 *   - Re-renders automatically when data changes (PowerSync reactive query)
 *   - Works 100% offline
 *
 * All reads are tenant-scoped. Never fetches from the network directly.
 */
import { usePowerSyncQuery } from '@powersync/react-native';
import type { Item } from '@saas-pos/domain';

interface RawItemRow {
  id: string;
  tenant_id: string;
  type: string;
  name: string;
  price: number;
  stock: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const useItems = (tenantId: string): Item[] => {
  const { data } = usePowerSyncQuery<RawItemRow>(
    `SELECT id, tenant_id, type, name, price, stock,
            created_at, updated_at, deleted_at
     FROM items
     WHERE tenant_id = ?
       AND deleted_at IS NULL
     ORDER BY name ASC`,
    [tenantId],
  );

  return (data ?? []).map((row) => ({
    id: row.id,
    tenant_id: row.tenant_id,
    type: row.type as Item['type'],
    name: row.name,
    price: row.price,
    stock: row.stock,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
  }));
};
