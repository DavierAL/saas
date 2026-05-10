import type { CSSProperties } from "react";
import type { Order } from "@saas-pos/domain";
import { formatMoney, createMoney } from "@saas-pos/domain";

type OrdersTableProps = {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

const STATUS_CONFIG = {
  paid: { label: "Pagado", color: "#3ECF8E", bg: "#0d2b1e" },
  pending: { label: "Pendiente", color: "#F59E0B", bg: "#2b1e0d" },
  cancelled: { label: "Cancelado", color: "#EF4444", bg: "#2b0d0d" },
  refunded: { label: "Reembolsado", color: "#818CF8", bg: "#14143b" },
  partially_refunded: { label: "Reem. Parcial", color: "#818CF8", bg: "#14143b" },
  voided: { label: "Anulado", color: "#9b9b9b", bg: "#1c1c1c" },
};

export function OrdersTable({ orders, onOrderClick, hasMore, loadingMore, onLoadMore }: OrdersTableProps) {
  return (
    <div style={s.container}>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>ID</th>
              <th style={s.th}>Fecha</th>
              <th style={{ ...s.th, textAlign: "right" }}>Total</th>
              <th style={{ ...s.th, textAlign: "right" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              return (
                <tr
                  key={order.id}
                  style={s.tr}
                  onClick={() => onOrderClick(order)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={s.td}>#{order.id.slice(-6)}</td>
                  <td style={s.td}>{new Date(order.created_at).toLocaleString("es-PE")}</td>
                  <td style={{ ...s.td, textAlign: "right", color: "#3ECF8E", fontWeight: 600 }}>
                    {formatMoney(createMoney(order.total_amount, "PEN"))}
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    <span style={{ ...s.statusBadge, backgroundColor: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div style={s.loadMore}>
          <button onClick={onLoadMore} disabled={loadingMore} style={s.loadBtn}>
            {loadingMore ? "Cargando más..." : "Cargar más"}
          </button>
        </div>
      )}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: "1rem" },
  tableWrap: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: 8,
    border: "1px solid var(--border-color)",
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
  tr: { cursor: "pointer", transition: "background 0.1s" },
  td: {
    padding: "12px 16px",
    fontSize: 13,
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-light)",
  },
  statusBadge: {
    display: "inline-flex",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
  },
  loadMore: { display: "flex", justifyContent: "center" },
  loadBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: 4,
    cursor: "pointer",
  },
};