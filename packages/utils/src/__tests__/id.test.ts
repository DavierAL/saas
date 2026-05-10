import { generateId } from '../id';

describe('generateId', () => {
  test('returns a valid UUID v4 format', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  test('returns different IDs on each call', () => {
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  test('returns string type', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  test('returns 36 character UUID', () => {
    const id = generateId();
    expect(id.length).toBe(36);
  });

  test('handles crypto.randomUUID availability', () => {
    const originalRandomUUID = crypto.randomUUID;

    // Test fallback when crypto.randomUUID is not available
    Object.defineProperty(crypto, 'randomUUID', {
      value: undefined,
      configurable: true,
    });

    const fallbackId = generateId();
    expect(fallbackId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    // Restore
    Object.defineProperty(crypto, 'randomUUID', {
      value: originalRandomUUID,
      configurable: true,
    });
  });
});