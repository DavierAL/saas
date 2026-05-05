import { useState, useEffect } from "react";
import { useTenantId } from "../hooks/useTenantId";
import { useCases } from "../lib/use-cases";
import type { Item } from "@saas-pos/domain";

export default function StockAlertsPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const [threshold, setThreshold] = useState(10);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refillItem, setRefillItem] = useState<Item | null>(null);
  const [refillQty, setRefillQty] = useState(10);
  const [refilling, setRefilling] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    async function fetch() {
      setLoading(true);
      try {
        const data = await useCases.manageCatalog.findLowStock(tenantId!, threshold);
        setItems(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [tenantId!, threshold]);

  const handleRefill = async () => {
    if (!refillItem || !tenantId) return;
    setRefilling(true);
    try {
      await useCases.manageCatalog.incrementStock(refillItem.id, refillQty, tenantId);
      setItems(items.filter((i) => i.id !== refillItem.id));
      setRefillItem(null);
    } catch (e) {
      console.error(e);
    } finally {
      setRefilling(false);
    }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return "var(--error-color)";
    if (stock < threshold) return "var(--warning-color)";
    return "var(--success-color)";
  };

  const getStockBg = (stock: number) => {
    if (stock === 0) return "var(--error-bg)";
    if (stock < threshold) return "var(--warning-bg)";
    return "var(--success-bg)";
  };

  if (tenantLoading || loading) {
    return <div style={s.page}><h1 style={s.title}>Alertas de Stock</h1><p style={s.loading}>Cargando...</p></div>;
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Alertas de Stock</h1>
        <div style={s.filters}>
          <label style={s.label}>Umbral:</label>
          <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={s.input} min={1} />
        </div>
      </div>

      {items.length === 0 ? (
        <p style={s.empty}>Todos los productos tienen stock suficiente</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Producto</th>
              <th style={{ ...s.th, textAlign: "center" }}>Stock</th>
              <th style={{ ...s.th, textAlign: "center" }}>Precio</th>
              <th style={{ ...s.th, textAlign: "right" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={s.td}>{item.name}</td>
                <td style={{ ...s.td, textAlign: "center" }}>
                  <span style={{ ...s.stockBadge, backgroundColor: getStockBg(item.stock ?? 0), color: getStockColor(item.stock ?? 0) }}>
                    {item.stock}
                  </span>
                </td>
                <td style={{ ...s.td, textAlign: "center" }}>{item.price / 100}</td>
                <td style={{ ...s.td, textAlign: "right" }}>
                  <button onClick={() => setRefillItem(item)} style={s.refillBtn}>Reabastecer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {refillItem && (
        <div style={s.modalOverlay} onClick={() => setRefillItem(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Reabastecer {refillItem.name}</h3>
            <p style={s.modalText}>Stock actual: <strong>{refillItem.stock}</strong></p>
            <label style={s.label}>Cantidad a agregar:</label>
            <input type="number" value={refillQty} onChange={(e) => setRefillQty(Number(e.target.value))} style={s.input} min={1} />
            <div style={s.modalButtons}>
              <button onClick={() => setRefillItem(null)} style={s.cancelBtn}>Cancelar</button>
              <button onClick={handleRefill} disabled={refilling} style={s.confirmBtn}>
                {refilling ? "Agregando..." : "Agregar Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { width: "100%", maxWidth: 800, padding: "0 32px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 },
  filters: { display: "flex", alignItems: "center", gap: 12 },
  label: { fontSize: 13, color: "var(--text-secondary)" },
  input: { padding: "6px 10px", borderRadius: 4, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", width: 70 },
  loading: { color: "var(--text-muted)", textAlign: "center", padding: 40 },
  empty: { color: "var(--text-muted)", textAlign: "center", padding: 40, fontSize: 14 },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "var(--bg-surface)", borderRadius: 8, overflow: "hidden" },
  th: { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-light)" },
  td: { padding: "12px 16px", fontSize: 13, color: "var(--text-primary)", borderBottom: "1px solid var(--border-light)" },
  stockBadge: { padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 600 },
  refillBtn: { padding: "6px 12px", borderRadius: 4, border: "1px solid var(--accent-border)", backgroundColor: "transparent", color: "var(--accent-color)", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 10, padding: 24, width: "90%", maxWidth: 360 },
  modalTitle: { margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" },
  modalText: { margin: "0 0 16px", fontSize: 13, color: "var(--text-secondary)" },
  modalButtons: { display: "flex", gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, padding: "10px", backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
  confirmBtn: { flex: 1, padding: "10px", backgroundColor: "var(--success-color)", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
};