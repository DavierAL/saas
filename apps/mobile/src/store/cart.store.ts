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
import type { PaymentMethod } from '@saas-pos/domain';

interface CartStore extends CartState {
  currency: string;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (item_id: string) => void;
  updateQuantity: (item_id: string, quantity: number) => void;
  clearCart: () => void;
  setCustomerId: (id: string | null) => void;
  setCustomerName: (name: string) => void;
  setPaymentMethod: (method: PaymentMethod | null | undefined) => void;
  setTipAmount: (amount: number) => void;
  setCurrency: (currency: string) => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  customer_id: null,
  customerName: '',
  paymentMethod: null,
  tipAmount: 0,
  currency: 'PEN',

  addItem: (item, quantity = 1) =>
    set((state) => ({ ...state, items: addItemToCart(state, item, quantity).items })),

  removeItem: (item_id) =>
    set((state) => ({ ...state, items: removeItemFromCart(state, item_id).items })),

  updateQuantity: (item_id, quantity) => {
    if (quantity <= 0) {
      set((state) => ({ ...state, items: removeItemFromCart(state, item_id).items }));
    } else {
      set((state) => ({
        ...state,
        items: state.items.map((item) =>
          item.item_id === item_id ? { ...item, quantity } : item,
        ),
      }));
    }
  },

  clearCart: () => set({ items: [], customer_id: null, customerName: '', paymentMethod: null, tipAmount: 0 }),

  setCustomerId: (id) => set({ customer_id: id }),

  setCustomerName: (name) => set({ customerName: name }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setTipAmount: (amount) => set({ tipAmount: amount }),

  setCurrency: (currency) => set({ currency }),

  total: () => getCartTotal(get(), get().currency) + (get().tipAmount ?? 0),

  itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
