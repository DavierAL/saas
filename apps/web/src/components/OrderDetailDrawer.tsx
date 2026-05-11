import { useEffect, useState } from "react";
import type { Order, OrderLine, OrderStatus } from "@saas-pos/domain";
import { formatMoney, createMoney, isValidOrderTransition } from "@saas-pos/domain";

interface OrderDetailDrawerProps {
  order: Order | null;
  lines: (OrderLine & { item?: { name: string } })[];
  loadingLines: boolean;
  onClose: () => void;
  onStatusChange?: (newStatus: OrderStatus) => void;
  statusLoading?: boolean;
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "Pagado", color: "#3ECF8E", bg: "#0d2b1e" },
  pending: { label: "Pendiente", color: "#F59E0B", bg: "#2b1e0d" },
  cancelled: { label: "Cancelado", color: "#EF4444", bg: "#2b0d0d" },
  refunded: { label: "Reembolsado", color: "#818CF8", bg: "#14143b" },
  partially_refunded: { label: "Reem. Parcial", color: "#818CF8", bg: "#14143b" },
  voided: { label: "Anulado", color: "#9b9b9b", bg: "#1c1c1c" },
};

export function OrderDetailDrawer({
  order,
  lines,
  loadingLines,
  onClose,
  onStatusChange,
  statusLoading = false,
}: OrderDetailDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (order) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [order]);

  if (!order) return null;

  const status = STATUS[order.status] ?? {
    label: order.status,
    color: "var(--text-muted)",
    bg: "var(--bg-elevated)",
  };

  const canCancel = isValidOrderTransition(order.status, "cancelled");
  const canRefund = isValidOrderTransition(order.status, "refunded");
  const canVoid = isValidOrderTransition(order.status, "voided");

  const handleConfirmAction = () => {
    if (confirmAction && onStatusChange) {
      onStatusChange(confirmAction);
      setConfirmAction(null);
    }
  };

  return (
    <div
      style={{
        ...s.overlay,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...s.content,
          transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          opacity: isVisible ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}>Detalle de Orden</h2>
            <p style={s.subtitle}>ID: {order.id.toUpperCase()}</p>
          </div>
          <button onClick={onClose} style={s.closeBtn} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={s.body}>
          {/* Info grid */}
          <div style={s.infoGrid}>
            <div style={s.infoCell}>
              <p style={s.infoLabel}>Fecha y Hora</p>
              <p style={s.infoValue}>
                {new Date(order.created_at).toLocaleString("es-PE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div style={s.infoCell}>
              <p style={s.infoLabel}>Estado</p>
              <span
                style={{
                  ...s.statusBadge,
                  backgroundColor: status.bg,
                  color: status.color,
                }}
              >
                {status.label}
              </span>
            </div>
            <div style={s.infoCell}>
              <p style={s.infoLabel}>Cliente</p>
              <p style={s.infoValue}>{order.customer_name || "—"}</p>
            </div>
            <div style={s.infoCell}>
              <p style={s.infoLabel}>Cajero</p>
              <p style={s.infoValue} title={order.user_id}>
                {order.user_id.slice(0, 8)}…
              </p>
            </div>
          </div>

          {/* Lines table */}
          <div style={s.linesSection}>
            <p style={s.infoLabel}>Productos</p>
            {loadingLines ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>
                Cargando productos…
              </p>
            ) : lines.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>
                Sin productos
              </p>
            ) : (
              <div style={s.table}>
                <div style={s.tableHeader}>
                  <span style={{ flex: 2 }}>Producto</span>
                  <span style={{ flex: 1, textAlign: "center" }}>Cant.</span>
                  <span style={{ flex: 1, textAlign: "right" }}>P. Unit.</span>
                  <span style={{ flex: 1, textAlign: "right" }}>Subtotal</span>
                </div>
                {lines.map((line) => (
                  <div key={line.id} style={s.tableRow}>
                    <span style={{ flex: 2, color: "var(--text-primary)", fontWeight: 500 }}>
                      {line.item?.name || "Producto desconocido"}
                    </span>
                    <span style={{ flex: 1, textAlign: "center" }}>x{line.quantity}</span>
                    <span style={{ flex: 1, textAlign: "right", color: "var(--text-secondary)" }}>
                      {formatMoney(createMoney(line.unit_price, order.currency))}
                    </span>
                    <span style={{ flex: 1, textAlign: "right", color: "var(--text-primary)", fontWeight: 500 }}>
                      {formatMoney(createMoney(line.subtotal, order.currency))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={s.footer}>
          {(order.tip_amount || 0) > 0 && (
            <div style={s.subtotalRow}>
              <span style={s.subtotalLabel}>Subtotal</span>
              <span style={s.subtotalValue}>
                {formatMoney(createMoney(order.total_amount - (order.tip_amount || 0), order.currency))}
              </span>
            </div>
          )}
          {(order.tip_amount || 0) > 0 && (
            <div style={s.subtotalRow}>
              <span style={s.subtotalLabel}>Propina</span>
              <span style={s.subtotalValue}>
                {formatMoney(createMoney(order.tip_amount || 0, order.currency))}
              </span>
            </div>
          )}
          <div style={s.totalRow}>
            <span style={s.totalLabel}>Total</span>
            <span style={s.totalValue}>
              {formatMoney(createMoney(order.total_amount, order.currency))}
            </span>
          </div>

          {/* Action buttons */}
          <div style={s.actionsRow}>
            {(canCancel || canRefund || canVoid) && (
              <>
                {canCancel && (
                  <button
                    onClick={() => setConfirmAction("cancelled")}
                    disabled={statusLoading}
                    style={{ ...s.actionBtn, ...s.cancelBtn }}
                  >
                    Anular
                  </button>
                )}
                {canRefund && (
                  <button
                    onClick={() => setConfirmAction("refunded")}
                    disabled={statusLoading}
                    style={{ ...s.actionBtn, ...s.refundBtn }}
                  >
                    Reembolsar
                  </button>
                )}
                {canVoid && (
                  <button
                    onClick={() => setConfirmAction("voided")}
                    disabled={statusLoading}
                    style={{ ...s.actionBtn, ...s.voidBtn }}
                  >
                    Anular
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {confirmAction && (
          <div style={s.confirmOverlay} onClick={() => setConfirmAction(null)}>
            <div style={s.confirmModal} onClick={(e) => e.stopPropagation()}>
              <h3 style={s.confirmTitle}>
                {confirmAction === "cancelled" && "Cancelar Orden"}
                {confirmAction === "refunded" && "Reembolsar Orden"}
                {confirmAction === "voided" && "Anular Orden"}
              </h3>
              <p style={s.confirmText}>
                {confirmAction === "cancelled" &&
                  "¿Estás seguro de cancelar esta orden? Se reversará el stock si aplica."}
                {confirmAction === "refunded" &&
                  "¿Estás seguro de reembolsar esta orden? Se devolverá el dinero al cliente."}
                {confirmAction === "voided" &&
                  "¿Estás seguro de anular esta orden? Esta acción es irreversible."}
              </p>
              <div style={s.confirmButtons}>
                <button
                  onClick={() => setConfirmAction(null)}
                  style={s.confirmCancelBtn}
                >
                  No, mantener
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={statusLoading}
                  style={s.confirmConfirmBtn}
                >
                  {statusLoading ? "Procesando..." : "Sí, continuar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    transition: "opacity 0.2s ease",
  },
  content: {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: 10,
    width: "90%",
    maxWidth: 560,
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px 16px",
    borderBottom: "1px solid var(--border-light)",
  },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-primary)" },
  subtitle: { margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: "1px solid var(--border-light)",
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  body: { padding: "20px 24px", overflowY: "auto", flex: 1 },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
    marginBottom: 20,
  },
  infoCell: { display: "flex", flexDirection: "column", gap: 4 },
  infoLabel: { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.3px", textTransform: "uppercase", margin: 0 },
  infoValue: { fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0 },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
  },
  linesSection: { marginTop: 4 },
  table: {
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--border-light)",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 8,
  },
  tableHeader: {
    display: "flex",
    padding: "8px 12px",
    backgroundColor: "var(--bg-elevated)",
    borderBottom: "1px solid var(--border-light)",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  tableRow: {
    display: "flex",
    padding: "10px 12px",
    borderBottom: "1px solid var(--border-light)",
    fontSize: 13,
    alignItems: "center",
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid var(--border-light)",
    backgroundColor: "var(--bg-elevated)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-light)" },
  totalLabel: { fontSize: 14, fontWeight: 700, color: "var(--text-primary)" },
  totalValue: { fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px" },
  subtotalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  subtotalLabel: { fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" },
  subtotalValue: { fontSize: 14, fontWeight: 500, color: "var(--text-primary)" },
  actionsRow: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 },
  actionBtn: { padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none" },
  cancelBtn: { backgroundColor: "var(--error-bg)", color: "var(--error-color)", border: "1px solid var(--error-border)" },
  refundBtn: { backgroundColor: "var(--warning-bg)", color: "var(--warning-color)", border: "1px solid var(--warning-border)" },
  voidBtn: { backgroundColor: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-color)" },
  confirmOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
  confirmModal: { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 10, padding: 24, width: "90%", maxWidth: 360 },
  confirmTitle: { margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" },
  confirmText: { margin: "0 0 20px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 },
  confirmButtons: { display: "flex", gap: 10 },
  confirmCancelBtn: { flex: 1, padding: "10px", backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
  confirmConfirmBtn: { flex: 1, padding: "10px", backgroundColor: "var(--error-color)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
};
