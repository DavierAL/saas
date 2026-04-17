import { createMoney, addMoney, multiplyMoney, formatMoney } from '../money';

describe('Money Value Object', () => {
  describe('creation', () => {
    test('should create valid money object', () => {
      const m = createMoney(1050, 'PEN');
      expect(m.amount).toBe(1050);
      expect(m.currency).toBe('PEN');
    });

    test('should throw error for non-integer cents', () => {
      expect(() => createMoney(10.5, 'PEN')).toThrow(/integer/);
    });

    test('should throw error for empty currency', () => {
      expect(() => createMoney(100, '')).toThrow(/Currency/);
    });
  });

  describe('arithmetic', () => {
    test('addMoney: should add same currency correctly', () => {
      const a = createMoney(100, 'PEN');
      const b = createMoney(200, 'PEN');
      expect(addMoney(a, b).amount).toBe(300);
    });

    test('addMoney: should throw for different currencies', () => {
      const a = createMoney(100, 'PEN');
      const b = createMoney(100, 'USD');
      expect(() => addMoney(a, b)).toThrow(/different currencies/);
    });

    test('multiplyMoney: should multiply correctly', () => {
      const m = createMoney(100, 'PEN');
      expect(multiplyMoney(m, 5).amount).toBe(500);
    });

    test('multiplyMoney: should handle zero quantity', () => {
      const m = createMoney(100, 'PEN');
      expect(multiplyMoney(m, 0).amount).toBe(0);
    });

    test('multiplyMoney: should throw for negative or non-integer quantity', () => {
      const m = createMoney(100, 'PEN');
      expect(() => multiplyMoney(m, -1)).toThrow();
      expect(() => multiplyMoney(m, 1.5)).toThrow();
    });
  });

  describe('formatting [DOM-002]', () => {
    test('should format positive amounts correctly', () => {
      expect(formatMoney(createMoney(1050, 'PEN'))).toBe('PEN 10.50');
      expect(formatMoney(createMoney(5, 'USD'))).toBe('USD 0.05');
    });

    test('should format negative amounts correctly', () => {
      // Fixes DOM-002 scenario where -150 % 100 = -50
      expect(formatMoney(createMoney(-150, 'PEN'))).toBe('PEN -1.50');
      expect(formatMoney(createMoney(-5, 'USD'))).toBe('USD -0.05');
    });

    test('should handle zero correctly', () => {
      expect(formatMoney(createMoney(0, 'PEN'))).toBe('PEN 0.00');
    });
  });

  describe('edge cases [TEST-005]', () => {
    test('should handle very large numbers (within MAX_SAFE_INTEGER)', () => {
      const max = Number.MAX_SAFE_INTEGER;
      const m = createMoney(max, 'PEN');
      expect(m.amount).toBe(max);
      // Caution: multiplyMax * 2 would definitely overflow
    });
  });
});
