import type { CSSProperties } from "react";
import { formatMoney, createMoney } from "@saas-pos/domain";

type StatsCardsProps = {
  totalRevenue: number;
  avgDailySales: number;
  topItemsTotalSold: number;
  totalOrders: number;
};

export function StatsCards({ totalRevenue, avgDailySales, topItemsTotalSold, totalOrders }: StatsCardsProps) {
  return (
    <div style={s.grid}>
      <StatCard label="Ingresos Totales" value={formatMoney(createMoney(totalRevenue, "PEN"))} accent="#3ECF8E" />
      <StatCard label="Venta Promedio/Día" value={formatMoney(createMoney(avgDailySales, "PEN"))} accent="#818CF8" />
      <StatCard label="Items Vendidos" value={topItemsTotalSold.toString()} accent="#F59E0B" />
      <StatCard label="Total Órdenes" value={totalOrders.toString()} accent="#3ECF8E" />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={s.card}>
      <div style={s.label}>{label}</div>
      <div style={{ ...s.value, color: accent }}>{value}</div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" },
  card: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: 8,
    border: "1px solid var(--border-color)",
    padding: "1rem",
  },
  label: { fontSize: 13, color: "var(--text-secondary)", marginBottom: "0.5rem" },
  value: { fontSize: 20, fontWeight: 700 },
};