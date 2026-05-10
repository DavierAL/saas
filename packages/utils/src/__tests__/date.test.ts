import { nowISO, isExpired, daysUntil } from '../date';

describe('date utilities', () => {
  describe('nowISO', () => {
    test('returns ISO 8601 format string', () => {
      const result = nowISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
    });

    test('returns current time', () => {
      const before = new Date().toISOString();
      const result = nowISO();
      const after = new Date().toISOString();

      expect(result >= before).toBe(true);
      expect(result <= after).toBe(true);
    });
  });

  describe('isExpired', () => {
    test('returns true for past date', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
      expect(isExpired(pastDate)).toBe(true);
    });

    test('returns false for future date', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow
      expect(isExpired(futureDate)).toBe(false);
    });

    test('returns true for current timestamp (boundary)', () => {
      const now = new Date().toISOString();
      expect(isExpired(now)).toBe(true);
    });

    test('handles date string without timezone', () => {
      const pastDate = '2020-01-01T00:00:00.000Z';
      expect(isExpired(pastDate)).toBe(true);
    });
  });

  describe('daysUntil', () => {
    test('returns positive number for future date', () => {
      const futureDate = new Date(Date.now() + 7 * 86400000).toISOString(); // 7 days from now
      const result = daysUntil(futureDate);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(7);
    });

    test('returns negative number for past date', () => {
      const pastDate = new Date(Date.now() - 3 * 86400000).toISOString(); // 3 days ago
      const result = daysUntil(pastDate);
      expect(result).toBeLessThan(0);
      expect(result).toBeGreaterThanOrEqual(-3);
    });

    test('returns 0 for today', () => {
      const today = new Date().toISOString();
      const result = daysUntil(today);
      expect(result).toBeLessThanOrEqual(0);
    });

    test('calculates correct days for exactly one day', () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const result = daysUntil(tomorrow);
      expect(result).toBe(1);
    });

    test('calculates correct days for negative', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const result = daysUntil(yesterday);
      expect(result).toBe(-1);
    });

    test('handles dates without milliseconds', () => {
      const futureDate = '2099-12-31T23:59:59Z';
      const result = daysUntil(futureDate);
      expect(result).toBeGreaterThan(0);
    });
  });
});