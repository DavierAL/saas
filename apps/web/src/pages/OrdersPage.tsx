import { useState } from "react";
import type { CSSProperties } from "react";
import type { Order, OrderLine } from "@saas-pos/domain";

import { useTenantId } from "../hooks/useTenantId";
import { useOrders } from "../hooks/useOrders";
import { OrdersTable } from "../components/orders";
import { OrderDetailDrawer } from "../components/OrderDetailDrawer";

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
        <div style={styles.errorBanner}>
          {error}
          <button onClick={clearError} style={styles.errorBtn}>Dismiss</button>
        </div>
      )}

      <h1 style={styles.title}>🧾 Órdenes</h1>

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
  errorBanner: {
    padding: "1rem",
    backgroundColor: "#7F1D1D",
    border: "1px solid #EF4444",
    borderRadius: "4px",
    marginBottom: "1rem",
    color: "#FCA5A5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorBtn: { background: "none", border: "none", color: "#FCA5A5", cursor: "pointer", textDecoration: "underline" },
};