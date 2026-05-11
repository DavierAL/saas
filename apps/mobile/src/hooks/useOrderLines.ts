/**
 * useOrderLines — Fetches line items for a specific order from local SQLite.
 * Used by OrderDetailScreen to render the receipt.
 *
 * NOTE: usePowerSyncQuery returns the array directly (not { data }).
 * This matches the pattern in useItems.ts and useOrders.ts.
 */
import { usePowerSyncQuery } from '@powersync/react-native';
import type { OrderLine } from '@saas-pos/domain';

interface RawOrderLine {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tenant_id: string;
}

export const useOrderLines = (orderId: string, tenantId: string): OrderLine[] => {
  const rows = usePowerSyncQuery<RawOrderLine>(
    `SELECT id, order_id, item_id, quantity, unit_price, subtotal, tenant_id
     FROM order_lines
     WHERE order_id = ? AND tenant_id = ?`,
    [orderId, tenantId],
  );

  return (rows ?? []).map((row) => ({
    id:         row.id,
    order_id:   row.order_id,
    item_id:    row.item_id,
    quantity:   row.quantity,
    unit_price: row.unit_price,
    subtotal:   row.subtotal,
    tenant_id:  row.tenant_id,
  }));
};
