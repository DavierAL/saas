import { useMemo } from "react";
import type { CSSProperties } from "react";

import { useTenantId } from "../hooks/useTenantId";
import { useInventory } from "../hooks/useInventory";
import { InventoryTable } from "../components/inventory";

export default function InventoryPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const { items, lowStockItems, loading, error, clearError } = useInventory(tenantId ?? null);

  const stats = useMemo(() => {
    const totalProducts = items.filter(i => i.stock !== null).length;
    const totalServices = items.filter(i => i.stock === null).length;
    const outOfStock = items.filter(i => i.stock === 0).length;
    return { totalProducts, totalServices, outOfStock };
  }, [items]);

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

      <h1 style={styles.title}>📦 Inventario</h1>

      <div style={styles.statsGrid}>
        <StatCard label="Total Productos" value={stats.totalProducts} accent="#3ECF8E" />
        <StatCard label="Servicios" value={stats.totalServices} accent="#818CF8" />
        <StatCard label="Stock Bajo" value={lowStockItems.length} accent="#F59E0B" />
        <StatCard label="Sin Stock" value={stats.outOfStock} accent="#EF4444" />
      </div>

      <h2 style={styles.sectionTitle}>Inventario Actual</h2>
      <InventoryTable items={items} />

      {lowStockItems.length > 0 && (
        <>
          <h2 style={{ ...styles.sectionTitle, marginTop: "2rem" }}>⚠️ Alertas de Stock</h2>
          <div style={styles.alertList}>
            {lowStockItems.map(item => (
              <div key={item.id} style={styles.alertItem}>
                <span style={styles.alertName}>{item.name}</span>
                <span style={styles.alertStock}>Stock: {item.stock}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div style={statStyles.card}>
      <div style={statStyles.label}>{label}</div>
      <div style={{ ...statStyles.value, color: accent }}>{value}</div>
    </div>
  );
}

const statStyles: Record<string, CSSProperties> = {
  card: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: 8,
    border: "1px solid #333",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  label: { fontSize: 14, color: "var(--text-secondary)", marginBottom: "0.5rem" },
  value: { fontSize: 24, fontWeight: 700 },
};

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
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" },
  sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: "1rem" },
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
  alertList: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  alertItem: {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid #F59E0B",
    borderRadius: 4,
    padding: "0.75rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertName: { fontWeight: 500 },
  alertStock: { color: "#F59E0B", fontWeight: 600 },
};