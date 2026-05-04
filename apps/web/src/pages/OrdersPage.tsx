import { useState, useEffect, useCallback } from "react";
import type { Order, OrderLine } from "@saas-pos/domain";
import { formatMoney, createMoney } from "@saas-pos/domain";
import { useCases } from "../lib/use-cases";
import { useTenantId } from "../hooks/useTenantId";

const STATUS = {
  paid: { label: "Pagado", color: "#3ECF8E", bg: "#0d2b1e" },
  pending: { label: "Pendiente", color: "#F59E0B", bg: "#2b1e0d" },
  cancelled: { label: "Cancelado", color: "#EF4444", bg: "#2b0d0d" },
  refunded: { label: "Reembolsado", color: "#818CF8", bg: "#14143b" },
  partially_refunded: {
    label: "Reem. Parcial",
    color: "#818CF8",
    bg: "#14143b",
  },
  voided: { label: "Anulado", color: "#9b9b9b", bg: "#1c1c1c" },
};

export function OrdersPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderLines, setOrderLines] = useState<(OrderLine & { item?: { name: string } })[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);

  const PAGE_SIZE = 20;

  const fetchOrders = useCallback(async (cursor?: string) => {
    if (!tenantId) return;
    try {
      const data = await useCases.orders.findByTenant(
        tenantId,
        cursor,
        PAGE_SIZE,
      );
      if (cursor) {
        setOrders((prev) => [...prev, ...data]);
      } else {
        setOrders(data);
      }
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
    if (tenantId) {
      fetchOrders();
    }
  }, [fetchOrders, tenantId]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const lastOrder = orders[orders.length - 1];
    fetchOrders(lastOrder?.created_at);
  };

  const handleOrderClick = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingLines(true);
    setOrderLines([]);
    try {
      if (tenantId) {
        const lines: OrderLine[] = await useCases.orders.getLines(order.id, tenantId);
        setOrderLines(lines);
      }
    } catch (err) {
      console.error("Error fetching order lines:", err);
    } finally {
      setLoadingLines(false);
    }
  };

  const totalRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Órdenes</h1>
          <p style={s.sub}>
            {loading ? "Cargando..." : `${orders.length} órdenes registradas`}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div style={s.statsGrid}>
        {[
          {
            label: "Total vendido",
            value: formatMoney(
              createMoney(totalRevenue, orders[0]?.currency || "PEN"),
            ),
            accent: true,
          },
          {
            label: "Órdenes pagadas",
            value: String(orders.filter((o) => o.status === "paid").length),
            accent: false,
          },
          {
            label: "Canceladas",
            value: String(
              orders.filter((o) => o.status === "cancelled").length,
            ),
            accent: false,
          },
        ].map((item) => (
          <div key={item.label} style={s.statCard}>
            <p style={s.statLabel}>{item.label}</p>
            <p
              style={{
                ...s.statValue,
                ...(item.accent ? { color: "#3ECF8E" } : {}),
              }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {tenantLoading || loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#555" }}>
          <p>Cargando órdenes...</p>
        </div>
      ) : error ? (
        <div
          style={{ textAlign: "center", padding: "48px 0", color: "#EF4444" }}
        >
          <p>Error: {error}</p>
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>ID Orden</th>
                <th style={s.th}>Fecha</th>
                <th style={s.th}>Estado</th>
                <th style={{ ...s.th, textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const cfg = STATUS[order.status] || STATUS.cancelled;
                const d = new Date(order.created_at);
                return (
                  <tr
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    style={{ ...s.tr, cursor: "pointer" }}
                    onMouseEnter={(e) =>
                      ((
                        e.currentTarget as HTMLTableRowElement
                      ).style.backgroundColor = "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      ((
                        e.currentTarget as HTMLTableRowElement
                      ).style.backgroundColor = "transparent")
                    }
                  >
                    <td style={s.td}>
                      <span
                        style={{
                          fontFamily: '"Geist Mono", monospace',
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td style={s.td}>
                      {d.toLocaleDateString("es-PE")}{" "}
                      {d.toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={s.td}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: cfg.bg,
                          color: cfg.color,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td
                      style={{
                        ...s.td,
                        textAlign: "right",
                        color: "var(--accent-color)",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatMoney(
                        createMoney(order.total_amount, order.currency),
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {hasMore && (
            <div
              style={{
                padding: 16,
                borderTop: "1px solid var(--border-color)",
                textAlign: "center",
              }}
            >
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loadingMore ? "default" : "pointer",
                  opacity: loadingMore ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  !loadingMore &&
                  (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  !loadingMore &&
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {loadingMore ? "Cargando..." : "Cargar más órdenes"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Detail */}
      {selectedOrder && (
        <div style={s.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div>
                <h2 style={s.modalTitle}>Detalle de Orden</h2>
                <p style={s.modalSub}>
                  ID: {selectedOrder.id.toUpperCase()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={s.closeBtn}
              >
                ✕
              </button>
            </div>

            <div style={s.modalBody}>
              <div style={s.detailGrid}>
                <div style={s.detailSection}>
                  <p style={s.detailLabel}>Fecha y Hora</p>
                  <p style={s.detailValue}>
                    {new Date(selectedOrder.created_at).toLocaleString("es-PE")}
                  </p>
                </div>
                <div style={s.detailSection}>
                  <p style={s.detailLabel}>Estado</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      ...s.statusBadge,
                      backgroundColor: STATUS[selectedOrder.status]?.bg || STATUS.cancelled.bg,
                      color: STATUS[selectedOrder.status]?.color || STATUS.cancelled.color,
                    }}>
                      {STATUS[selectedOrder.status]?.label || selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={s.linesSection}>
                <p style={s.detailLabel}>Productos</p>
                {loadingLines ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>Cargando productos...</p>
                ) : (
                  <div style={s.linesTable}>
                    <div style={s.lineHeader}>
                      <span style={{ flex: 2 }}>Producto</span>
                      <span style={{ flex: 1, textAlign: 'center' }}>Cant.</span>
                      <span style={{ flex: 1, textAlign: 'right' }}>Subtotal</span>
                    </div>
                    {orderLines.map((line) => (
                      <div key={line.id} style={s.lineRow}>
                        <span style={{ flex: 2, color: 'var(--text-primary)', fontWeight: 500 }}>
                          {line.item?.name || 'Producto desconocido'}
                        </span>
                        <span style={{ flex: 1, textAlign: 'center' }}>
                          x{line.quantity}
                        </span>
                        <span style={{ flex: 1, textAlign: 'right', color: 'var(--text-primary)' }}>
                          {formatMoney(createMoney(line.subtotal, selectedOrder.currency))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={s.modalFooter}>
                <div style={s.totalRow}>
                  <span style={s.totalLabel}>Total</span>
                  <span style={s.totalValue}>
                    {formatMoney(createMoney(selectedOrder.total_amount, selectedOrder.currency))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: "32px 40px", maxWidth: 960 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
    margin: 0,
  },
  sub: { fontSize: 13, color: "var(--text-muted)", marginTop: 4, margin: 0 },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: 8,
    padding: "18px 20px",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
    margin: "0 0 8px",
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
    margin: 0,
  },
  tableWrap: {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: 8,
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "10px 16px",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textAlign: "left",
    borderBottom: "1px solid var(--border-color)",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },
  tr: { transition: "background 0.1s" },
  td: {
    padding: "12px 16px",
    fontSize: 13,
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-light)",
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease-out',
  },
  modalContent: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  modalSub: {
    fontSize: 11,
    fontFamily: '"Geist Mono", monospace',
    color: 'var(--text-muted)',
    marginTop: 4,
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: 20,
    cursor: 'pointer',
    padding: 4,
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    marginBottom: 32,
  },
  detailSection: {},
  detailLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 8,
    margin: '0 0 8px',
  },
  detailValue: {
    fontSize: 14,
    color: 'var(--text-primary)',
    margin: 0,
  },
  statusBadge: {
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  linesSection: {
    marginBottom: 32,
  },
  linesTable: {
    border: '1px solid var(--border-light)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  lineHeader: {
    display: 'flex',
    padding: '10px 16px',
    backgroundColor: 'var(--bg-primary)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--border-light)',
  },
  lineRow: {
    display: 'flex',
    padding: '12px 16px',
    fontSize: 13,
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-light)',
    alignItems: 'center',
  },
  modalFooter: {
    padding: '20px 24px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--accent-color)',
  },
};
