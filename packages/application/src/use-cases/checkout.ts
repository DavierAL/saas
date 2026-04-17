import { calculateOrderTotal, validateStock, multiplyMoney, createMoney, SubscriptionExpiredError, InsufficientStockError } from '@saas-pos/domain';
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
  readonly currency: string; // [DOM-008] Pass tenant currency
  readonly lines: readonly CheckoutLineInput[];
}

// CheckoutResult is now just the Order on success,
// and errors are thrown for the caller to handle.
export type CheckoutResult = Order;

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
    throw new SubscriptionExpiredError(input.tenant_id);
  }

  // ── Step 2: Stock validation ─────────────────────────────────
  const allItems = await deps.itemRepo.findAll(input.tenant_id);
  const stockCheck = validateStock(input.lines, allItems);
  if (!stockCheck.valid) {
    const mainFailure = stockCheck.insufficientItems[0]!;
    throw new InsufficientStockError(
      mainFailure.item_id,
      mainFailure.available,
      mainFailure.requested,
    );
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
    // [DOM-003] Use domain Money arithmetic — avoids floating-point drift
    subtotal:   multiplyMoney(createMoney(line.unit_price, input.currency), line.quantity).amount,
    tenant_id:  input.tenant_id,
  }));

  const total = calculateOrderTotal(input.lines, input.currency);

  const order: Order = {
    id:           orderId,
    tenant_id:    input.tenant_id,
    user_id:      input.user_id,
    currency:     input.currency, // [DOM-008]
    status:       'paid',  // POS: paid immediately at counter
    total_amount: total.amount,
    created_at:   now,
    updated_at:   now,
    deleted_at:   null,
  };

  // ── Step 4: Atomic SQLite transaction ─────────────────────────
  await deps.orderRepo.insertOrderWithLines(order, orderLines);

  // [DOM-001] Decrement stock for each product line after successful insert.
  // Services (stock = null) are skipped by the repository implementation.
  const productLines = input.lines.filter((line) => {
    const item = allItems.find((i) => i.id === line.item_id);
    return item?.type === 'product' && item.stock !== null;
  });
  await Promise.all(
    productLines.map((line) =>
      deps.itemRepo.decrementStock(line.item_id, line.quantity, input.tenant_id),
    ),
  );

  return order;
};
