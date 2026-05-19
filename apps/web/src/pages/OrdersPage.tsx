import { useState } from "react";
import type { CSSProperties } from "react";
import type { Order, OrderLine } from "@saas-pos/domain";

import { useTenantId } from "../hooks/useTenantId";
import { useOrders } from "../hooks/useOrders";
import { OrdersTable } from "../components/orders";
import { OrderDetailDrawer } from "../components/OrderDetailDrawer";
import { ErrorBanner } from "../components/ErrorBanner";

export function OrdersPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const { orders, loading, loadingMore, error, hasMore, loadMore, fetchOrderLines, clearError } = useOrders(tenantId ?? null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderLines, setOrderLines] = useState<(OrderLine & { item?: { name: string } })[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);

  const handleOrderClick = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingLines(true);
    setOrderLines([]);
    try {
      const lines = await fetchOrderLines(order.id);
      setOrderLines(lines);
    } catch (err) {
      console.error("Error fetching order lines:", err);
    } finally {
      setLoadingLines(false);
    }
  };

  if (tenantLoading || loading) {
    return <div style={styles.loading}><h2>Cargando...</h2></div>;
  }

  return (
    <div style={styles.page}>
      {error && (
        <ErrorBanner message={error} onDismiss={clearError} />
      )}

      <h1 style={styles.title}>Órdenes</h1>

      <OrdersTable
        orders={orders}
        onOrderClick={handleOrderClick}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
      />

      <OrderDetailDrawer
        order={selectedOrder}
        lines={orderLines}
        loadingLines={loadingLines}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)",
    padding: "2rem",
    minHeight: "100vh",
  },
  loading: {
    backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)",
    padding: "2rem",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { marginTop: 0, marginBottom: "1.5rem", fontSize: "var(--font-size-6xl)", fontWeight: "var(--font-weight-bold)" },
};