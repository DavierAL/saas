import { usePowerSyncQuery } from '@powersync/react-native';
import type { Order } from '@saas-pos/domain';

interface RawOrderRow {
  id: string;
  tenant_id: string;
  user_id: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const useOrders = (tenantId: string, limit = 50): Order[] => {
  const data = usePowerSyncQuery<RawOrderRow>(
    `SELECT id, tenant_id, user_id, status, total_amount, currency,
            created_at, updated_at, deleted_at
     FROM orders
     WHERE tenant_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ?`,
    [tenantId, limit],
  );

  return (data || []).map((row) => ({
    ...row,
    status: row.status as Order['status'],
  }));
};
