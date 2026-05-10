import { useState, useEffect, useCallback } from "react";
import type { Order, OrderLine } from "@saas-pos/domain";
import { useCases } from "../lib/use-cases";

export function useOrders(tenantId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 20;

  const fetchOrders = useCallback(async (cursor?: string) => {
    if (!tenantId) return;
    try {
      const data = await useCases.orders.findByTenant(tenantId, cursor, PAGE_SIZE);
      setOrders((prev) => cursor ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    } catch (err: any) {
      setError(err.message || "Error al cargar las órdenes");
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) fetchOrders();
  }, [fetchOrders, tenantId]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const lastOrder = orders[orders.length - 1];
    fetchOrders(lastOrder?.created_at);
  };

  const fetchOrderLines = useCallback(async (orderId: string): Promise<OrderLine[]> => {
    if (!tenantId) return [];
    try {
      return await useCases.orders.getLines(orderId, tenantId);
    } catch (err) {
      console.error("Error fetching order lines:", err);
      return [];
    }
  }, [tenantId]);

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    if (!tenantId) return;
    try {
      await useCases.orders.updateStatus(orderId, status, tenantId);
      await fetchOrders();
    } catch (err: any) {
      setError(err.message || "Error al actualizar estado");
      throw err;
    }
  }, [tenantId, fetchOrders]);

  const clearError = useCallback(() => setError(null), []);

  return {
    orders,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    fetchOrderLines,
    updateOrderStatus,
    refetch: fetchOrders,
    clearError,
  };
}