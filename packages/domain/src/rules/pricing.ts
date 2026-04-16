import type { Money } from '../value-objects/money';
import { createMoney, multiplyMoney, addMoney } from '../value-objects/money';

export interface LineItemInput {
  readonly unit_price: number; // integer cents
  readonly quantity: number;
}

/**
 * Calculates the subtotal for a single line item.
 */
export const calculateLineSubtotal = (line: LineItemInput): Money => {
  const price = createMoney(line.unit_price);
  return multiplyMoney(price, line.quantity);
};

/**
 * Calculates the total for an entire order from its line items.
 */
export const calculateOrderTotal = (lines: readonly LineItemInput[]): Money => {
  return lines.reduce<Money>(
    (acc, line) => addMoney(acc, calculateLineSubtotal(line)),
    createMoney(0)
  );
};
