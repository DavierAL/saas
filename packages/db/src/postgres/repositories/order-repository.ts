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
}
