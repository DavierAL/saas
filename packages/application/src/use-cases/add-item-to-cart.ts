import { multiplyMoney, addMoney, createMoney } from '@saas-pos/domain';

export interface CartItem {
  readonly item_id: string;
  readonly name: string;
  readonly unit_price: number; // integer cents
  readonly quantity: number;
}

export interface CartState {
  readonly items: readonly CartItem[];
}

export const addItemToCart = (
  cart: CartState,
  item: Omit<CartItem, 'quantity'>,
  quantity = 1,
): CartState => {
  const existingIndex = cart.items.findIndex((i) => i.item_id === item.item_id);

  if (existingIndex >= 0) {
    const updated = cart.items.map((cartItem, index) =>
      index === existingIndex
        ? { ...cartItem, quantity: cartItem.quantity + quantity }
        : cartItem,
    );
    return { items: updated };
  }

  return {
    items: [...cart.items, { ...item, quantity }],
  };
};

export const removeItemFromCart = (
  cart: CartState,
  item_id: string,
): CartState => ({
  items: cart.items.filter((i) => i.item_id !== item_id),
});

// [DOM-003] Use Money domain arithmetic to avoid floating-point accumulation
export const getCartTotal = (cart: CartState, currency: string): number =>
  cart.items.reduce(
    (acc, item) => addMoney(acc, multiplyMoney(createMoney(item.unit_price, currency), item.quantity)),
    createMoney(0, currency),
  ).amount;

