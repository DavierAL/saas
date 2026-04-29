/**
 * Cart Store — Zustand (ephemeral UI state ONLY)
 *
 * Architecture rule: Zustand is ONLY for ephemeral state.
 * This store is never persisted to SQLite or synced.
 * It is cleared after a successful checkout.
 *
 * On checkout, the use case reads from this store and
 * writes to SQLite via the OrderRepository.
 */
import { create } from 'zustand';
import { addItemToCart, removeItemFromCart, getCartTotal } from '@saas-pos/application';
import type { CartItem, CartState } from '@saas-pos/application';

interface CartStore extends CartState {
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (item_id: string) => void;
  updateQuantity: (item_id: string, quantity: number) => void;
  clearCart: () => void;
  setCustomerName: (name: string) => void;

  // Derived (computed inline)
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customerName: '',

  addItem: (item, quantity = 1) =>
    set((state) => addItemToCart(state, item, quantity)),

  removeItem: (item_id) =>
    set((state) => removeItemFromCart(state, item_id)),

  updateQuantity: (item_id, quantity) => {
    if (quantity <= 0) {
      set((state) => removeItemFromCart(state, item_id));
    } else {
      set((state) => ({
        items: state.items.map((item) =>
          item.item_id === item_id ? { ...item, quantity } : item,
        ),
      }));
    }
  },

  clearCart: () => set({ items: [], customerName: '' }),

  setCustomerName: (name) => set({ customerName: name }),

  total: () => getCartTotal(get(), 'PEN'),

  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
