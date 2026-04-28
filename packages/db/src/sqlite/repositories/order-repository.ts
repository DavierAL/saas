/**
 * OrderRepository — SQLite implementation
 *
 * CRITICAL: insertOrderWithLines MUST run in a single SQLite transaction.
 * PowerSync's writeTransaction() guarantees atomicity:
 *   - Either ALL writes succeed (order + lines + stock deduction)
 *   - Or NONE are persisted (rollback on any error)
 *
 * This is the heart of the checkout flow.
 */
import { IOrderRepositoryPort } from '@saas-pos/application';
import type { PowerSyncDatabase } from '@powersync/react-native';
import type { Order, OrderLine, OrderAnalytics } from '@saas-pos/domain';
import { nowISO } from '@saas-pos/utils';

export class SqliteOrderRepository implements IOrderRepositoryPort {
  constructor(private readonly db: PowerSyncDatabase) {}

  async getAnalytics(tenantId: string, days = 7): Promise<OrderAnalytics> {
    // For now, local analytics are a stub to satisfy the interface.
    // Real implementation would require complex aggregation over the orders table.
    return {
      daily_sales: [],
      top_items: [],
      revenue_by_category: [],
    };
  }

  /**
   * Atomic checkout: inserts order + all lines + decrements stock
   * in a single SQLite transaction.
   *
   * If ANY operation fails, the entire transaction is rolled back.
   * PowerSync will sync all these writes to Supabase as a unit.
   */
  async insertOrderWithLines(order: Order, lines: readonly OrderLine[]): Promise<void> {
    await this.db.writeTransaction(async (tx) => {
      // 1. Insert order header
      await tx.execute(
        `INSERT INTO orders (id, tenant_id, user_id, status, total_amount, currency, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          order.tenant_id,
          order.user_id,
          order.status,
          order.total_amount,
          order.currency,
          order.created_at,
          order.updated_at,
        ],
      );

      // 2. Insert all order lines
      for (const line of lines) {
        await tx.execute(
          `INSERT INTO order_lines (id, order_id, item_id, quantity, unit_price, subtotal, tenant_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            line.id,
            line.order_id,
            line.item_id,
            line.quantity,
            line.unit_price,
            line.subtotal,
            order.tenant_id,
          ],
        );

        // 3. Decrement stock for product items (services have stock = NULL, no-op)
        await tx.execute(
          `UPDATE items
           SET stock = stock - ?, updated_at = ?
           WHERE id = ? AND tenant_id = ? AND type = 'product' AND stock IS NOT NULL`,
          [line.quantity, nowISO(), line.item_id, order.tenant_id],
        );
      }
    });
  }

  async findByTenant(tenantId: string, cursor?: string, limit = 50): Promise<Order[]> {
    const whereFlags = ['tenant_id = ?', 'deleted_at IS NULL'];
    const params: unknown[] = [tenantId];

    if (cursor) {
      // [DB-002] Cursor-based pagination: fetch items older than the cursor date
      whereFlags.push('created_at < ?');
      params.push(cursor);
    }

    const rows = await this.db.getAll<Order>(
      `SELECT id, tenant_id, user_id, status, total_amount, currency,
              created_at, updated_at, deleted_at
       FROM orders
       WHERE ${whereFlags.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT ?`,
      [...params, limit],
    );
    return rows;
  }

  async findById(id: string, tenantId: string): Promise<Order | null> {
    const row = await this.db.getOptional<Order>(
      `SELECT id, tenant_id, user_id, status, total_amount, currency,
              created_at, updated_at, deleted_at
       FROM orders WHERE id = ? AND tenant_id = ?`,
      [id, tenantId],
    );
    return row ?? null;
  }

  async updateStatus(
    id: string,
    status: Order['status'],
    tenantId: string,
  ): Promise<void> {
    await this.db.execute(
      `UPDATE orders SET status = ?, updated_at = ?
       WHERE id = ? AND tenant_id = ?`,
      [status, nowISO(), id, tenantId],
    );
  }

  async getLinesByOrderId(orderId: string, tenantId: string): Promise<OrderLine[]> {
    return this.db.getAll<OrderLine>(
      `SELECT id, order_id, item_id, quantity, unit_price, subtotal, tenant_id
       FROM order_lines
       WHERE order_id = ? AND tenant_id = ?`,
      [orderId, tenantId],
    );
  }
}
