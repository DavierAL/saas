import type { Order, OrderLine } from '@saas-pos/domain';
import { calculateOrderTotal } from '@saas-pos/domain';

export interface CreateOrderInput {
  readonly id: string;
  readonly tenant_id: string;
  readonly user_id: string;
  readonly currency: string; // [DOM-008]
  readonly lines: readonly {
    readonly id: string;
    readonly item_id: string;
    readonly quantity: number;
    readonly unit_price: number; // integer cents
  }[];
}

export interface OrderRepository {
  insertOrderWithLines(order: Order, lines: readonly OrderLine[]): Promise<void>;
}

/**
 * CreateOrder use case.
 * Builds domain objects and delegates persistence to the repository.
 * The repository MUST run this inside a single SQLite transaction.
 */
export const createOrder = async (
  input: CreateOrderInput,
  repo: OrderRepository,
): Promise<Order> => {
  const now = new Date().toISOString();

  const orderLines: OrderLine[] = input.lines.map((line) => ({
    id: line.id,
    order_id: input.id,
    item_id: line.item_id,
    quantity: line.quantity,
    unit_price: line.unit_price,
    subtotal: line.unit_price * line.quantity,
    tenant_id: input.tenant_id,
  }));

  const total = calculateOrderTotal(input.lines, input.currency);

  const order: Order = {
    id: input.id,
    tenant_id: input.tenant_id,
    user_id: input.user_id,
    currency: input.currency, // [DOM-008]
    status: 'pending',
    total_amount: total.amount,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await repo.insertOrderWithLines(order, orderLines);

  return order;
};
