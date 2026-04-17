/**
 * Money value object.
 * All monetary values are stored as integer cents to avoid
 * floating-point precision issues (e.g., $10.50 = 1050).
 */
export interface Money {
  readonly amount: number; // integer cents
  readonly currency: string;
}

export const createMoney = (amount: number, currency: string): Money => {
  if (!Number.isInteger(amount)) {
    throw new Error(`Money amount must be integer cents, got: ${amount}`);
  }
  if (!currency || currency.trim() === '') {
    throw new Error('Currency code is required');
  }
  return { amount, currency: currency.trim().toUpperCase() };
};

export const addMoney = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add different currencies: ${a.currency} + ${b.currency}`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
};

export const multiplyMoney = (money: Money, quantity: number): Money => {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Quantity must be a non-negative integer, got: ${quantity}`);
  }
  return { amount: money.amount * quantity, currency: money.currency };
};

export const formatMoney = (money: Money): string => {
  // [DOM-002] Separate sign before arithmetic to avoid e.g. -150 => "S/ -2.50" (wrong)
  const isNegative = money.amount < 0;
  const absAmount = Math.abs(money.amount);
  const whole = Math.floor(absAmount / 100);
  const cents = absAmount % 100;
  const sign = isNegative ? '-' : '';
  return `${money.currency} ${sign}${whole}.${cents.toString().padStart(2, '0')}`;
};
