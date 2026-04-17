/**
 * [DOM-006] Complete order status state machine.
 *
 * Valid transitions:
 *   pending   → paid | cancelled
 *   paid      → refunded | partially_refunded
 *   refunded  → (terminal)
 *   partially_refunded → refunded
 *   cancelled → (terminal)
 *   voided    → (terminal)  — admin-only hard cancel before payment
 */
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'voided';

/** Maps each status to the set of statuses it may legally transition into. */
export const ORDER_STATUS_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  pending:            ['paid', 'cancelled', 'voided'],
  paid:               ['refunded', 'partially_refunded'],
  cancelled:          [],
  refunded:           [],
  partially_refunded: ['refunded'],
  voided:             [],
};

/** Returns true if transitioning from `from` to `to` is a legal state change. */
export const isValidOrderTransition = (from: OrderStatus, to: OrderStatus): boolean =>
  (ORDER_STATUS_TRANSITIONS[from] as readonly OrderStatus[]).includes(to);

export interface Order {
  readonly id: string;
  readonly tenant_id: string;
  readonly user_id: string;
  readonly status: OrderStatus;
  readonly total_amount: number; // integer cents
  readonly currency: string;     // [DOM-008] Order currency snapshot
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
}
