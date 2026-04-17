/**
 * useOrderLines — Fetches line items for a specific order from local SQLite.
 * Used by OrderDetailScreen to render the receipt.
 *
 * NOTE: usePowerSyncQuery returns the array directly (not { data }).
 * This matches the pattern in useItems.ts and useOrders.ts.
 */
import { usePowerSyncQuery } from '@powersync/react-native';
import type { OrderLine } from '@saas-pos/domain';

export const useOrderLines = (orderId: string, tenantId: string): OrderLine[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = usePowerSyncQuery(
    `SELECT id, order_id, item_id, quantity, unit_price, subtotal, tenant_id
     FROM order_lines
     WHERE order_id = ? AND tenant_id = ?`,
    [orderId, tenantId],
  ) as unknown as any[];

  return (rows ?? []).map((row) => ({
    id:         row.id as string,
    order_id:   row.order_id as string,
    item_id:    row.item_id as string,
    quantity:   row.quantity as number,
    unit_price: row.unit_price as number,
    subtotal:   row.subtotal as number,
    tenant_id:  row.tenant_id as string,
  }));
};
