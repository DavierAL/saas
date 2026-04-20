import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useCases } from "../lib/use-cases";
import type { OrderAnalytics } from "@saas-pos/domain";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { colors, spacing, typography, radius } from "@saas-pos/ui";
import { supabase } from "../lib/supabase";

/**
 * AnalyticsPage: Sales analytics dashboard with charts
 * Shows: daily sales trends, top items, revenue by type
 * Connects to Supabase RPC get_sales_analytics
 */

const FIXED_TENANT_ID = "a002a002-0000-0000-0000-000000000001"; // TODO: Get from context/auth

// Color scheme from tokens
const COLORS = [
  colors.accent.green,
  colors.accent.indigo,
  colors.accent.amber,
  colors.status.info,
];
const DARK_BG = colors.bg.base;
const SURFACE = colors.bg.surface;
const TEXT_PRIMARY = colors.text.primary;
const TEXT_SECONDARY = colors.text.secondary;
const ACCENT = colors.accent.green;

export default function AnalyticsPage() {
  const [data, setData] = useState<OrderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean>(true);

  useEffect(() => {
    // Check session for RLS awareness
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    setLoading(true);
    console.log("Fetching analytics for tenant:", FIXED_TENANT_ID);
    useCases.orders
      .getAnalytics(FIXED_TENANT_ID)
      .then((res) => {
        console.log("Analytics result:", res);
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching analytics:", err);
        let msg = err.message || "Error al conectar con la base de datos";
        if (msg.includes("Failed to fetch")) {
          msg =
            "Error de Red: No se pudo contactar con Supabase. Verifica tu VITE_SUPABASE_URL en .env.local y tu conexión a internet.";
        }
        setError(msg);
        setLoading(false);
      });
  }, []);

  // Calculate summary metrics
  const totalRevenue = useMemo(
    () => data?.daily_sales.reduce((sum, d) => sum + d.sales, 0) || 0,
    [data],
  );

  const avgDailySales = data?.daily_sales.length
    ? Math.round(totalRevenue / data.daily_sales.length)
    : 0;

  const topItemsTotalSold =
    data?.top_items.reduce((sum, item) => sum + item.sales, 0) || 0;

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: DARK_BG,
          color: TEXT_PRIMARY,
          padding: "2rem",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2 style={{ color: ACCENT }}>📊 Cargando estadísticas...</h2>
        <p style={{ color: TEXT_SECONDARY }}>Esto puede tomar un momento.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: DARK_BG,
          color: TEXT_PRIMARY,
          padding: "2rem",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            padding: "2rem",
            backgroundColor: SURFACE,
            borderRadius: "8px",
            border: "1px solid #2b0d0d",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#EF4444" }}>❌ Error de conexión</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: ACCENT,
              color: "#0f0f0f",
              border: "none",
              borderRadius: "4px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div
        style={{
          backgroundColor: DARK_BG,
          color: TEXT_PRIMARY,
          padding: "2rem",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: typography.size["6xl"], fontWeight: typography.weight.bold }}>
          📊 Analytics Real-time
        </h1>

        {!hasSession && (
          <div
            style={{
              backgroundColor: colors.accent.amberDim,
              border: `1px solid ${colors.accent.amberDim}`,
              borderLeft: `4px solid ${colors.accent.amber}`,
              padding: spacing[4],
              borderRadius: radius.md,
              marginBottom: spacing[6],
              color: TEXT_PRIMARY,
            }}
          >
            <strong style={{ color: colors.accent.amber }}>⚠️ Sesión no detectada:</strong>{" "}
            Debido a las políticas de seguridad (RLS), es posible que no veas datos hasta que inicies sesión con una cuenta autorizada para este tenant.
          </div>
        )}

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <SummaryCard
            label="Revenue Total (30d)"
            value={`S/ ${(totalRevenue / 100).toFixed(2)}`}
          />
          <SummaryCard
            label="Promedio Venta Diaria"
            value={`S/ ${(avgDailySales / 100).toFixed(2)}`}
          />
          <SummaryCard
            label="Items Vendidos (Top 5)"
            value={`${topItemsTotalSold} uds`}
          />
          <SummaryCard label="Estado" value="Actualizado" />
        </div>

        {/* Charts Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "2rem",
            marginBottom: "2rem",
          }}
        >
          <ChartContainer title="💹 Tendencia de Ventas Diarias">
            {!data || data.daily_sales.length === 0 ? (
              <EmptyChartMsg />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={data.daily_sales.slice()}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    stroke={TEXT_SECONDARY}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke={TEXT_SECONDARY}
                    style={{ fontSize: "12px" }}
                    tickFormatter={(val: number) =>
                      `S/ ${(Number(val) / 100).toFixed(0)}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: SURFACE,
                      border: `1px solid ${ACCENT}`,
                      borderRadius: "4px",
                      color: TEXT_PRIMARY,
                    }}
                    formatter={(val: number) =>
                      `S/ ${(Number(val) / 100).toFixed(2)}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke={ACCENT}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>

          {/* Top Items */}
          <ChartContainer title="🏆 Items más Vendidos (Cantidades)">
            {!data || data.top_items.length === 0 ? (
              <EmptyChartMsg />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data.top_items.slice()}
                  margin={{ top: 5, right: 30, left: 0, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="name"
                    stroke={TEXT_SECONDARY}
                    style={{ fontSize: "12px" }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke={TEXT_SECONDARY} style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: SURFACE,
                      border: `1px solid ${ACCENT}`,
                      borderRadius: "4px",
                      color: TEXT_PRIMARY,
                    }}
                  />
                  <Bar dataKey="sales" fill={ACCENT} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>

        {/* Revenue by Type */}
        <ChartContainer
          title="🍕 Revenue por Categoría (Producto vs Servicio)"
          style={{ maxWidth: "500px" }}
        >
          {!data || data.revenue_by_category.length === 0 ? (
            <EmptyChartMsg />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <Pie
                  data={data.revenue_by_category.slice()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) =>
                    `${name === "product" ? "Productos" : "Servicios"}: S/ ${(value / 100).toFixed(0)}`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.revenue_by_category.map((_: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: SURFACE,
                    border: `1px solid ${ACCENT}`,
                    borderRadius: "4px",
                    color: TEXT_PRIMARY,
                  }}
                  formatter={(value) =>
                    `S/ ${(Number(value) / 100).toFixed(2)}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        {/* Footer Note */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: SURFACE,
            borderLeft: `3px solid ${ACCENT}`,
            borderRadius: "4px",
            color: TEXT_SECONDARY,
            fontSize: "14px",
          }}
        >
          📌 Datos consolidados de Supabase. Los ingresos se muestran en Soles
          (S/).
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Helper Components
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        backgroundColor: SURFACE,
        padding: "1.5rem",
        borderRadius: "8px",
        border: `1px solid #333`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          color: TEXT_SECONDARY,
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "24px", fontWeight: 700, color: ACCENT }}>
        {value}
      </div>
    </div>
  );
}

function ChartContainer({
  title,
  children,
  style = {},
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        backgroundColor: SURFACE,
        padding: "1.5rem",
        borderRadius: "8px",
        border: `1px solid #333`,
        ...style,
      }}
    >
      <h3
        style={{
          marginTop: 0,
          fontSize: "16px",
          fontWeight: 600,
          color: ACCENT,
          marginBottom: "1rem",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyChartMsg() {
  return (
    <div
      style={{
        height: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: TEXT_SECONDARY,
        fontSize: "14px",
        fontStyle: "italic",
      }}
    >
      No hay datos suficientes para este periodo.
    </div>
  );
}
