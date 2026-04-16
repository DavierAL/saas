/**
 * Money value object.
 * All monetary values are stored as integer cents to avoid
 * floating-point precision issues (e.g., $10.50 = 1050).
 */
export interface Money {
  readonly amount: number; // integer cents
  readonly currency: string;
}

export const createMoney = (amount: number, currency = 'PEN'): Money => {
  if (!Number.isInteger(amount)) {
    throw new Error(`Money amount must be integer cents, got: ${amount}`);
  }
  return { amount, currency };
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
  const whole = Math.floor(money.amount / 100);
  const cents = Math.abs(money.amount % 100);
  return `${money.currency} ${whole}.${cents.toString().padStart(2, '0')}`;
};
