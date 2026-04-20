import { useState, useCallback, useMemo } from 'react';
import { usePowerSyncQuery } from '@powersync/react-native';
import type { Order } from '@saas-pos/domain';

export interface UseOrdersResult {
  orders: Order[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * useOrders — Reactive hook for fetching orders with cursor-based pagination support.
 * 
 * [UX-013] Uses a dynamic limit to allow PowerSync to keep the list reactive
 * while only loading what the user has scrolled to.
 */
export const useOrders = (tenantId: string, pageSize = 20): UseOrdersResult => {
  const [limit, setLimit] = useState(pageSize);

  // We use the reactive query with a dynamic limit.
  // This ensures that if a new order is created, it shows up at the top automatically.
  const data = usePowerSyncQuery<Order>(
    `SELECT id, tenant_id, user_id, status, total_amount, currency,
            created_at, updated_at, deleted_at
     FROM orders
     WHERE tenant_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT ?`,
    [tenantId, limit],
  );

  const orders = useMemo(() => {
    return (data || []).map((row) => ({
      ...row,
      status: row.status as Order['status'],
    }));
  }, [data]);

  const loadMore = useCallback(() => {
    // [DB-002] Increase limit to "fetch" next page. 
    // PowerSync will re-run the query and update the reactive `data`.
    setLimit((prev) => prev + pageSize);
  }, [pageSize]);

  // If we returned fewer items than the current limit, we've reached the end.
  const hasMore = orders.length === limit;

  return {
    orders,
    isLoading: data === undefined,
    hasMore,
    loadMore,
  };
};
