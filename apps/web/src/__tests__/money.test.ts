import { describe, test, expect } from 'vitest';
import { createMoney, formatMoney } from '@saas-pos/domain';

describe('Money - Unit Tests', () => {
  test('createMoney creates correct amount', () => {
    const m = createMoney(1050, 'PEN');
    expect(m.amount).toBe(1050);
    expect(m.currency).toBe('PEN');
  });

  test('createMoney throws for decimal cents', () => {
    expect(() => createMoney(10.5, 'PEN')).toThrow();
  });

  test('formatMoney formats PEN correctly', () => {
    expect(formatMoney(createMoney(1050, 'PEN'))).toBe('PEN 10.50');
  });

  test('formatMoney formats USD correctly', () => {
    expect(formatMoney(createMoney(500, 'USD'))).toBe('USD 5.00');
  });

  test('formatMoney formats zero correctly', () => {
    expect(formatMoney(createMoney(0, 'PEN'))).toBe('PEN 0.00');
  });

  test('formatMoney formats large amounts correctly', () => {
    expect(formatMoney(createMoney(999999, 'PEN'))).toBe('PEN 9999.99');
  });

  test('formatMoney formats negative amounts correctly', () => {
    expect(formatMoney(createMoney(-150, 'PEN'))).toBe('PEN -1.50');
  });
});
