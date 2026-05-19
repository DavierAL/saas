import { useState, useEffect } from "react";
import { formatMoney, createMoney } from "@saas-pos/domain";
import { useTenantId } from "../hooks/useTenantId";
import { useCases } from "../lib/use-cases";
import { arrayToCsv } from "../utils/csv-export";

interface DailyClosing {
  orders: any[];
  totalRevenue: number;
  orderCount: number;
  byUser: { user_id: string; count: number; total: number }[];
  byType: { type: string; count: number; total: number }[];
}

export default function CashClosingPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const today = new Date().toISOString().split("T")[0] ?? "";
  const [date, setDate] = useState(today);
  const [data, setData] = useState<DailyClosing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    async function fetchClosing() {
      setLoading(true);
      setError(null);
      try {
        const result = await useCases.orders.getDailyClosing(tenantId!, date || today);
        setData(result);
      } catch (err: any) {
        setError(err.message || "Error al cargar el cierre de caja");
      } finally {
        setLoading(false);
      }
    }

    fetchClosing();
  }, [tenantId, date, today]);

  const handleExport = () => {
    if (!data) return;
    const avg = data.orderCount > 0 ? Math.round(data.totalRevenue / data.orderCount) : 0;
    const rows = [
      { metric: "Total Vendido", value: data.totalRevenue / 100 },
      { metric: "Número de Órdenes", value: data.orderCount },
      { metric: "Ticket Promedio", value: avg / 100 },
      { metric: "", value: "" },
      { metric: "Por Cajero", value: "" },
      ...data.byUser.map((u) => ({ metric: u.user_id.slice(0, 8), value: u.total / 100 })),
    ];
    const csv = arrayToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cierre_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (tenantLoading || loading) {
    return (
      <div style={s.pageContent}>
        <h1 style={s.pageTitle}>Cierre de Caja</h1>
        <p style={s.loading}>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.pageContent}>
        <h1 style={s.pageTitle}>Cierre de Caja</h1>
        <p style={s.error}>{error}</p>
      </div>
    );
  }

  if (!data || data.orderCount === 0) {
    return (
      <div style={s.pageContent}>
        <div style={s.header}>
          <h1 style={s.pageTitle}>Cierre de Caja</h1>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={s.dateInput} />
        </div>
        <p style={s.empty}>Sin ventas en esta fecha</p>
      </div>
    );
  }

  const avgTicket = data.orderCount > 0 ? Math.round(data.totalRevenue / data.orderCount) : 0;

  return (
    <div style={s.pageContent}>
      <div style={s.header}>
        <h1 style={s.pageTitle}>Cierre de Caja</h1>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={s.dateInput} />
      </div>

      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <span style={s.statLabel}>Total Vendido</span>
          <span style={s.statValue}>{formatMoney(createMoney(data.totalRevenue, "PEN"))}</span>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Órdenes</span>
          <span style={s.statValue}>{data.orderCount}</span>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Ticket Promedio</span>
          <span style={s.statValue}>{formatMoney(createMoney(avgTicket, "PEN"))}</span>
        </div>
      </div>

      <div style={s.section}>
        <h2 style={s.sectionTitle}>Por Cajero</h2>
        <table style={s.table}>
          <thead>
            <tr><th style={s.th}>Cajero</th><th style={{ ...s.th, textAlign: "center" }}>Órdenes</th><th style={{ ...s.th, textAlign: "right" }}>Total</th></tr>
          </thead>
          <tbody>
            {data.byUser.map((u) => (
              <tr key={u.user_id}>
                <td style={s.td}>{u.user_id.slice(0, 8)}…</td>
                <td style={{ ...s.td, textAlign: "center" }}>{u.count}</td>
                <td style={{ ...s.td, textAlign: "right" }}>{formatMoney(createMoney(u.total, "PEN"))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={s.section}>
        <h2 style={s.sectionTitle}>Por Tipo</h2>
        <table style={s.table}>
          <thead>
            <tr><th style={s.th}>Tipo</th><th style={{ ...s.th, textAlign: "center" }}>Órdenes</th><th style={{ ...s.th, textAlign: "right" }}>Total</th></tr>
          </thead>
          <tbody>
            {data.byType.map((t) => (
              <tr key={t.type}>
                <td style={s.td}>{t.type === "product" ? "Productos" : "Servicios"}</td>
                <td style={{ ...s.td, textAlign: "center" }}>{t.count}</td>
                <td style={{ ...s.td, textAlign: "right" }}>{formatMoney(createMoney(t.total, "PEN"))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={handleExport} style={s.exportBtn}>Exportar CSV</button>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  pageContent: { width: "100%", maxWidth: 800 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 },
  dateInput: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", fontSize: 14 },
  loading: { color: "var(--text-muted)", padding: 40, textAlign: "center" },
  error: { color: "var(--error-color)", padding: 40, textAlign: "center" },
  empty: { color: "var(--text-muted)", padding: 40, textAlign: "center", fontSize: 14 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 },
  statCard: { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 4 },
  statLabel: { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" },
  statValue: { fontSize: 24, fontWeight: 700, color: "var(--text-primary)" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 12 },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "var(--bg-surface)", borderRadius: 8, overflow: "hidden" },
  th: { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border-light)" },
  td: { padding: "12px 16px", fontSize: 13, color: "var(--text-primary)", borderBottom: "1px solid var(--border-light)" },
  exportBtn: { backgroundColor: "var(--accent-bg)", color: "var(--accent-color)", border: "1px solid var(--accent-border)", padding: "10px 20px", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer" },
};