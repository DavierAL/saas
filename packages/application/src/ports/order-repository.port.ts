import type { Order, OrderLine } from '@saas-pos/domain';

export interface IOrderRepositoryPort {
  insertOrderWithLines(order: Order, lines: readonly OrderLine[]): Promise<void>;
  findByTenant(tenantId: string, cursor?: string, limit?: number): Promise<Order[]>;
  findById(id: string, tenantId: string): Promise<Order | null>;
  updateStatus(id: string, status: Order['status'], tenantId: string): Promise<void>;
  getLinesByOrderId(orderId: string, tenantId: string): Promise<OrderLine[]>;
}
