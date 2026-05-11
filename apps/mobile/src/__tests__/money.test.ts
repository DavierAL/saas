import { describe, test, expect } from 'vitest';
import { createMoney, addMoney, multiplyMoney, formatMoney } from '@saas-pos/domain';

describe('Money Value Object', () => {
  describe('createMoney', () => {
    test('creates valid money object', () => {
      const m = createMoney(1050, 'PEN');
      expect(m.amount).toBe(1050);
      expect(m.currency).toBe('PEN');
    });

    test('throws for non-integer cents', () => {
      expect(() => createMoney(10.5, 'PEN')).toThrow(/integer/i);
    });

    test('throws for empty currency', () => {
      expect(() => createMoney(100, '')).toThrow(/currency/i);
    });
  });

  describe('addMoney', () => {
    test('adds same currency correctly', () => {
      const a = createMoney(100, 'PEN');
      const b = createMoney(200, 'PEN');
      expect(addMoney(a, b).amount).toBe(300);
    });

    test('throws for different currencies', () => {
      const a = createMoney(100, 'PEN');
      const b = createMoney(100, 'USD');
      expect(() => addMoney(a, b)).toThrow(/different currencies/i);
    });
  });

  describe('multiplyMoney', () => {
    test('multiplies correctly', () => {
      const m = createMoney(100, 'PEN');
      expect(multiplyMoney(m, 5).amount).toBe(500);
    });

    test('handles zero', () => {
      const m = createMoney(100, 'PEN');
      expect(multiplyMoney(m, 0).amount).toBe(0);
    });

    test('throws for negative quantity', () => {
      const m = createMoney(100, 'PEN');
      expect(() => multiplyMoney(m, -1)).toThrow();
    });

    test('throws for non-integer quantity', () => {
      const m = createMoney(100, 'PEN');
      expect(() => multiplyMoney(m, 1.5)).toThrow();
    });
  });

  describe('formatMoney', () => {
    test('formats positive amounts correctly', () => {
      expect(formatMoney(createMoney(1050, 'PEN'))).toBe('PEN 10.50');
      expect(formatMoney(createMoney(5, 'USD'))).toBe('USD 0.05');
    });

    test('formats negative amounts correctly', () => {
      expect(formatMoney(createMoney(-150, 'PEN'))).toBe('PEN -1.50');
    });

    test('formats zero correctly', () => {
      expect(formatMoney(createMoney(0, 'PEN'))).toBe('PEN 0.00');
    });
  });
});
