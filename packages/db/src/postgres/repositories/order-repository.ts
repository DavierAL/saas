import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order, OrderLine } from '@saas-pos/domain';
import type { IOrderRepositoryPort } from '@saas-pos/application';

export class SupabaseOrderRepository implements IOrderRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Atomic Order creation via Supabase RPC.
   * This function wraps the insertion of order, lines, and stock updates in a DB transaction.
   */
  async insertOrderWithLines(order: Order, lines: readonly OrderLine[]): Promise<void> {
    const { error } = await this.client.rpc('create_order_with_lines', {
      p_order: order,
      p_lines: lines,
    });

    if (error) throw error;
  }

  async findByTenant(tenantId: string, cursor?: string, limit = 50): Promise<Order[]> {
    let query = this.client
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      // [DB-002] Cursor-based pagination: fetch items older than the cursor date
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Order[];
  }

  async findById(id: string, tenantId: string): Promise<Order | null> {
    const { data, error } = await this.client
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Order | null;
  }

  async updateStatus(id: string, status: Order['status'], tenantId: string): Promise<void> {
    const { error } = await this.client
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  async getLinesByOrderId(orderId: string, tenantId: string): Promise<OrderLine[]> {
    const { data, error } = await this.client
      .from('order_lines')
      .select('*, item:items(name)')
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data as OrderLine[];
  }

  async getAnalytics(tenantId: string, days = 30): Promise<import('@saas-pos/domain').OrderAnalytics> {
    const { data, error } = await this.client.rpc('get_sales_analytics', {
      p_tenant_id: tenantId,
      p_days: days,
    });

    if (error) throw error;
    return data as import('@saas-pos/domain').OrderAnalytics;
  }

  async getDailyClosing(tenantId: string, date: string): Promise<{
    orders: Order[];
    totalRevenue: number;
    orderCount: number;
    byUser: { user_id: string; count: number; total: number }[];
    byType: { type: string; count: number; total: number }[];
  }> {
    const startDate = `${date}T00:00:00`;
    const endDate = `${date}T23:59:59`;

    const { data: orders, error } = await this.client
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('status', 'paid')
      .is('deleted_at', null);

    if (error) throw error;

    const paidOrders = orders as Order[];
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);

    // Group by user
    const byUserMap = new Map<string, { count: number; total: number }>();
    for (const o of paidOrders) {
      const existing = byUserMap.get(o.user_id) || { count: 0, total: 0 };
      byUserMap.set(o.user_id, { count: existing.count + 1, total: existing.total + o.total_amount });
    }
    const byUser = Array.from(byUserMap.entries()).map(([user_id, v]) => ({ user_id, ...v }));

    // Group by type (simplified - would need join with items)
    const byType = [
      { type: 'product', count: paidOrders.length, total: totalRevenue },
      { type: 'service', count: 0, total: 0 },
    ];

    return {
      orders: paidOrders,
      totalRevenue,
      orderCount: paidOrders.length,
      byUser,
      byType,
    };
  }
}
