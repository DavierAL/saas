import { validateStock } from '../rules/inventory';
import type { Item } from '../entities/item';

const makeItem = (
  id: string,
  type: Item['type'],
  stock: number | null,
): Item => ({
  id,
  tenant_id:  'tenant-1',
  type,
  name:       `Item ${id}`,
  price:      100,
  stock,
  created_at: '',
  updated_at: '',
  deleted_at: null,
});

describe('validateStock', () => {
  test('empty cart is always valid', () => {
    const result = validateStock([], [makeItem('p1', 'product', 0)]);
    expect(result.valid).toBe(true);
    expect(result.insufficientItems).toHaveLength(0);
  });

  test('sufficient stock → valid', () => {
    const items = [makeItem('p1', 'product', 10)];
    const result = validateStock([{ item_id: 'p1', quantity: 5 }], items);
    expect(result.valid).toBe(true);
  });

  test('exact stock match → valid', () => {
    const items = [makeItem('p1', 'product', 5)];
    const result = validateStock([{ item_id: 'p1', quantity: 5 }], items);
    expect(result.valid).toBe(true);
  });

  test('insufficient stock → invalid with details', () => {
    const items = [makeItem('p1', 'product', 3)];
    const result = validateStock([{ item_id: 'p1', quantity: 5 }], items);
    expect(result.valid).toBe(false);
    expect(result.insufficientItems).toHaveLength(1);
    expect(result.insufficientItems[0]!.available).toBe(3);
    expect(result.insufficientItems[0]!.requested).toBe(5);
  });

  test('out-of-stock (stock = 0) → invalid', () => {
    const items = [makeItem('p1', 'product', 0)];
    const result = validateStock([{ item_id: 'p1', quantity: 1 }], items);
    expect(result.valid).toBe(false);
  });

  test('service items bypass stock check (stock = null)', () => {
    const items = [makeItem('s1', 'service', null)];
    const result = validateStock([{ item_id: 's1', quantity: 100 }], items);
    expect(result.valid).toBe(true);
  });

  test('mixed cart: one ok, one insufficient', () => {
    const items = [
      makeItem('p1', 'product', 10),
      makeItem('p2', 'product', 2),
    ];
    const result = validateStock(
      [
        { item_id: 'p1', quantity: 5 },
        { item_id: 'p2', quantity: 5 },
      ],
      items,
    );
    expect(result.valid).toBe(false);
    expect(result.insufficientItems).toHaveLength(1);
    expect(result.insufficientItems[0]!.item_id).toBe('p2');
  });

  test('unknown item is ignored (no crash)', () => {
    const result = validateStock(
      [{ item_id: 'unknown-id', quantity: 5 }],
      [],
    );
    expect(result.valid).toBe(true); // unknown items don't fail validation
  });

  test('identifies item name in failure report', () => {
    const items = [makeItem('p1', 'product', 1)];
    const result = validateStock([{ item_id: 'p1', quantity: 3 }], items);
    expect(result.insufficientItems[0]!.name).toBe('Item p1');
  });
});
