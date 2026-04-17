import {
  addItemToCart,
  removeItemFromCart,
  getCartTotal,
} from '../use-cases/add-item-to-cart';
import type { CartState } from '../use-cases/add-item-to-cart';

const ITEM_A = { item_id: 'prod-1', name: 'Coca Cola 500ml', unit_price: 250 };
const ITEM_B = { item_id: 'prod-2', name: 'Leche Gloria 1L', unit_price: 380 };
const EMPTY: CartState = { items: [] };

describe('addItemToCart', () => {
  test('adds new item to empty cart with qty 1', () => {
    const result = addItemToCart(EMPTY, ITEM_A);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.quantity).toBe(1);
    expect(result.items[0]!.item_id).toBe('prod-1');
  });

  test('adds new item with custom quantity', () => {
    const result = addItemToCart(EMPTY, ITEM_A, 3);
    expect(result.items[0]!.quantity).toBe(3);
  });

  test('increments quantity if item already in cart', () => {
    const cart1 = addItemToCart(EMPTY, ITEM_A, 2);
    const cart2 = addItemToCart(cart1, ITEM_A, 3);
    expect(cart2.items).toHaveLength(1);
    expect(cart2.items[0]!.quantity).toBe(5);
  });

  test('adds different items as separate rows', () => {
    const cart1 = addItemToCart(EMPTY, ITEM_A);
    const cart2 = addItemToCart(cart1, ITEM_B);
    expect(cart2.items).toHaveLength(2);
  });

  test('does not mutate original cart (immutable)', () => {
    const original = addItemToCart(EMPTY, ITEM_A);
    addItemToCart(original, ITEM_B);
    expect(original.items).toHaveLength(1);
  });
});

describe('removeItemFromCart', () => {
  test('removes correct item', () => {
    let cart = addItemToCart(EMPTY, ITEM_A);
    cart = addItemToCart(cart, ITEM_B);
    const result = removeItemFromCart(cart, 'prod-1');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.item_id).toBe('prod-2');
  });

  test('removing non-existent item is a no-op', () => {
    const cart = addItemToCart(EMPTY, ITEM_A);
    const result = removeItemFromCart(cart, 'does-not-exist');
    expect(result.items).toHaveLength(1);
  });
});

describe('getCartTotal', () => {
  test('returns 0 for empty cart', () => {
    expect(getCartTotal(EMPTY, 'PEN')).toBe(0);
  });

  test('single item total', () => {
    const cart = addItemToCart(EMPTY, ITEM_A, 2); // 2 × 250 = 500
    expect(getCartTotal(cart, 'PEN')).toBe(500);
  });

  test('multi-item total', () => {
    let cart = addItemToCart(EMPTY, ITEM_A, 2);  // 500
    cart = addItemToCart(cart, ITEM_B, 1);        // 380
    expect(getCartTotal(cart, 'PEN')).toBe(880);
  });
});
