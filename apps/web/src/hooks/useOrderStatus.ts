import { useState, useCallback } from "react";
import type { Order, OrderStatus } from "@saas-pos/domain";
import { useCases } from "../lib/use-cases";

interface UseOrderStatusOptions {
  order: Order | null;
  onSuccess?: () => void;
}

export function useOrderStatus({ order, onSuccess }: UseOrderStatusOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transitionStatus = useCallback(
    async (targetStatus: OrderStatus) => {
      if (!order) return;

      setLoading(true);
      setError(null);

      try {
        await useCases.orders.updateStatus(order.id, targetStatus, order.tenant_id);
        onSuccess?.();
      } catch (err: any) {
        setError(err.message || "Error al actualizar el estado");
      } finally {
        setLoading(false);
      }
    },
    [order, onSuccess],
  );

  const cancelOrder = useCallback(async () => {
    await transitionStatus("cancelled");
  }, [transitionStatus]);

  const refundOrder = useCallback(async () => {
    await transitionStatus("refunded");
  }, [transitionStatus]);

  const voidOrder = useCallback(async () => {
    await transitionStatus("voided");
  }, [transitionStatus]);

  return {
    loading,
    error,
    cancelOrder,
    refundOrder,
    voidOrder,
  };
}