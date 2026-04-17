import { calculateLineSubtotal, calculateOrderTotal } from '../rules/pricing';
import {
  createMoney,
  addMoney,
  multiplyMoney,
  formatMoney,
} from '../value-objects/money';

// ─── Money Value Object ───────────────────────────────────────
describe('Money value object', () => {
  test('createMoney: accepts integer cents', () => {
    expect(() => createMoney(1050)).not.toThrow();
    expect(createMoney(1050).amount).toBe(1050);
  });

  test('createMoney: throws for float', () => {
    expect(() => createMoney(10.5)).toThrow();
  });

  test('createMoney: zero is valid', () => {
    expect(createMoney(0).amount).toBe(0);
  });

  test('addMoney: adds same currency', () => {
    const a = createMoney(500);
    const b = createMoney(300);
    expect(addMoney(a, b).amount).toBe(800);
  });

  test('addMoney: throws on currency mismatch', () => {
    expect(() => addMoney(createMoney(100, 'PEN'), createMoney(100, 'USD'))).toThrow();
  });

  test('multiplyMoney: quantity 0 gives 0', () => {
    expect(multiplyMoney(createMoney(500), 0).amount).toBe(0);
  });

  test('multiplyMoney: quantity 3', () => {
    expect(multiplyMoney(createMoney(500), 3).amount).toBe(1500);
  });

  test('multiplyMoney: throws for negative quantity', () => {
    expect(() => multiplyMoney(createMoney(500), -1)).toThrow();
  });

  test('formatMoney: PEN 10.50', () => {
    expect(formatMoney(createMoney(1050))).toBe('PEN 10.50');
  });

  test('formatMoney: PEN 0.00', () => {
    expect(formatMoney(createMoney(0))).toBe('PEN 0.00');
  });

  test('formatMoney: PEN 1.00', () => {
    expect(formatMoney(createMoney(100))).toBe('PEN 1.00');
  });

  test('formatMoney: PEN 7.05', () => {
    expect(formatMoney(createMoney(705))).toBe('PEN 7.05');
  });
});

// ─── Pricing Rules ────────────────────────────────────────────
describe('calculateLineSubtotal', () => {
  test('1 unit × 380 cents = 380 cents', () => {
    expect(calculateLineSubtotal({ unit_price: 380, quantity: 1 }).amount).toBe(380);
  });

  test('2 units × 500 cents = 1000 cents', () => {
    expect(calculateLineSubtotal({ unit_price: 500, quantity: 2 }).amount).toBe(1000);
  });

  test('0 units = 0', () => {
    expect(calculateLineSubtotal({ unit_price: 999, quantity: 0 }).amount).toBe(0);
  });

  test('preserves currency', () => {
    const result = calculateLineSubtotal({ unit_price: 500, quantity: 2 });
    expect(result.currency).toBe('PEN');
  });
});

describe('calculateOrderTotal', () => {
  test('empty order = 0', () => {
    expect(calculateOrderTotal([]).amount).toBe(0);
  });

  test('single line', () => {
    const lines = [{ unit_price: 700, quantity: 5 }];
    expect(calculateOrderTotal(lines).amount).toBe(3500);
  });

  test('multiple lines sum correctly', () => {
    const lines = [
      { unit_price: 250, quantity: 2 }, // 500
      { unit_price: 380, quantity: 1 }, // 380
      { unit_price: 450, quantity: 3 }, // 1350
    ];
    // 500 + 380 + 1350 = 2230
    expect(calculateOrderTotal(lines).amount).toBe(2230);
  });

  test('matches manual calculation', () => {
    const lines = [
      { unit_price: 1500, quantity: 1 },
      { unit_price: 380,  quantity: 2 },
    ];
    const expected = 1500 + 380 * 2; // 2260
    expect(calculateOrderTotal(lines).amount).toBe(expected);
  });
});
