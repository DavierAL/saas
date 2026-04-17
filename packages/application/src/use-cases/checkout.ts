import { calculateOrderTotal, validateStock } from '@saas-pos/domain';
import type { Order, OrderLine } from '@saas-pos/domain';
import { generateId, nowISO } from '@saas-pos/utils';
import type { IOrderRepositoryPort } from '../ports/order-repository.port';
import type { IItemRepositoryPort } from '../ports/item-repository.port';
import type { ITenantRepositoryPort } from '../ports/tenant-repository.port';

export interface CheckoutLineInput {
  readonly item_id: string;
  readonly quantity: number;
  readonly unit_price: number; // integer cents — snapshot at time of sale
}

export interface CheckoutInput {
  readonly tenant_id: string;
  readonly user_id: string;
  readonly lines: readonly CheckoutLineInput[];
}

export type CheckoutResult =
  | { success: true; order: Order }
  | { success: false; reason: string };

interface CheckoutDeps {
  orderRepo: IOrderRepositoryPort;
  itemRepo: IItemRepositoryPort;
  tenantRepo: ITenantRepositoryPort;
}

/**
 * Checkout use case — the core POS transaction.
 *
 * Steps:
 *   1. Validate subscription (offline paywall check)
 *   2. Validate stock for all product lines
 *   3. Build Order + OrderLine domain objects
 *   4. Execute single atomic SQLite transaction:
 *      INSERT order + lines + UPDATE stock
 *   5. Return the completed Order
 *
 * This function is pure application logic.
 * It never touches the network or UI.
 */
export const checkout = async (
  input: CheckoutInput,
  deps: CheckoutDeps,
): Promise<CheckoutResult> => {
  // ── Step 1: Subscription check ──────────────────────────────
  const isActive = await deps.tenantRepo.isSubscriptionActive(input.tenant_id);
  if (!isActive) {
    return {
      success: false,
      reason: 'Suscripción vencida. No se pueden registrar ventas.',
    };
  }

  // ── Step 2: Stock validation ─────────────────────────────────
  const allItems = await deps.itemRepo.findAll(input.tenant_id);
  const stockCheck = validateStock(input.lines, allItems);
  if (!stockCheck.valid) {
    const names = stockCheck.insufficientItems.map(
      (i) => `${i.name} (disponible: ${i.available}, pedido: ${i.requested})`,
    );
    return {
      success: false,
      reason: `Stock insuficiente: ${names.join(', ')}`,
    };
  }

  // ── Step 3: Build domain objects ──────────────────────────────
  const now = nowISO();
  const orderId = generateId();

  const orderLines: OrderLine[] = input.lines.map((line) => ({
    id:         generateId(),
    order_id:   orderId,
    item_id:    line.item_id,
    quantity:   line.quantity,
    unit_price: line.unit_price,
    subtotal:   line.unit_price * line.quantity,
  }));

  const total = calculateOrderTotal(input.lines);

  const order: Order = {
    id:           orderId,
    tenant_id:    input.tenant_id,
    user_id:      input.user_id,
    status:       'paid',  // POS: paid immediately at counter
    total_amount: total.amount,
    created_at:   now,
    updated_at:   now,
    deleted_at:   null,
  };

  // ── Step 4: Atomic SQLite transaction ─────────────────────────
  await deps.orderRepo.insertOrderWithLines(order, orderLines);

  return { success: true, order };
};
