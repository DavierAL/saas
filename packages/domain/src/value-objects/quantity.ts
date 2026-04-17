/**
 * Quantity value object.
 * Enforces non-negative integer quantities.
 */
export interface Quantity {
  readonly value: number;
}

export const MAX_QUANTITY = 10000;

export const createQuantity = (value: number): Quantity => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Quantity must be a non-negative integer, got: ${value}`);
  }
  if (value > MAX_QUANTITY) {
    throw new Error(`Quantity cannot exceed ${MAX_QUANTITY}, got: ${value}`);
  }
  return { value };
};

export const incrementQuantity = (q: Quantity, by = 1): Quantity =>
  createQuantity(q.value + by);

export const decrementQuantity = (q: Quantity, by = 1): Quantity =>
  createQuantity(q.value - by);
