/**
 * useCheckout — coordinates the checkout flow
 *
 * Connects the Zustand cart store to the checkout use case,
 * which writes to SQLite via the OrderRepository.
 */
import { useState, useCallback } from 'react';
import { usePowerSync } from '@powersync/react-native';
import { checkout } from '@saas-pos/application';
import { SqliteOrderRepository } from '@saas-pos/db';
import { SqliteItemRepository } from '@saas-pos/db';
import { SqliteTenantRepository } from '@saas-pos/db';
import { useCartStore } from '../store/cart.store';
import { useAuth } from '../providers/AppProvider';
import type { Order } from '@saas-pos/domain';

type CheckoutState = 'idle' | 'processing' | 'success' | 'error';

export const useCheckout = () => {
  const db = usePowerSync();
  const { tenantId } = useAuth();
  const cart = useCartStore();

  const [state, setState] = useState<CheckoutState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const processCheckout = useCallback(async () => {
    if (!tenantId || cart.items.length === 0) return;

    setState('processing');
    setError(null);

    const result = await checkout(
      {
        tenant_id: tenantId,
        user_id: 'demo-user-id',  // Phase 3 will use real auth user
        lines: cart.items.map((item) => ({
          item_id:    item.item_id,
          quantity:   item.quantity,
          unit_price: item.unit_price,
        })),
      },
      {
        orderRepo:  new SqliteOrderRepository(db),
        itemRepo:   new SqliteItemRepository(db),
        tenantRepo: new SqliteTenantRepository(db),
      },
    );

    if (result.success) {
      setLastOrder(result.order);
      cart.clearCart();
      setState('success');
    } else {
      setError(result.reason);
      setState('error');
    }
  }, [db, tenantId, cart]);

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
    setLastOrder(null);
  }, []);

  return {
    state,
    error,
    lastOrder,
    processCheckout,
    reset,
    cartTotal: cart.total(),
    itemCount: cart.itemCount(),
  };
};
