import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * AnalyticsPage: Sales analytics dashboard with charts
 * Shows: daily sales trends, top items, revenue by type
 * Uses mock data (in production, would fetch from PowerSync)
 */

// Mock data generators
const generateDailySalesData = () => {
  const data = [];
  const today = new Date();
  for (let i = 30; i > 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' }),
      sales: Math.floor(Math.random() * 5000) + 500,
    });
  }
  return data;
};

const generateTopItemsData = () => [
  { name: 'Café Espresso', sales: 450 },
  { name: 'Cappuccino', sales: 380 },
  { name: 'Sándwich Premium', sales: 320 },
  { name: 'Pastel de Chocolate', sales: 290 },
  { name: 'Té Verde', sales: 210 },
];

const generateRevenueByTypeData = () => [
  { name: 'Bebidas', value: 4500 },
  { name: 'Alimentos', value: 3200 },
  { name: 'Postres', value: 2100 },
  { name: 'Snacks', value: 1800 },
];

// Color scheme
const COLORS = ['#3ECF8E', '#10b981', '#059669', '#047857'];
const DARK_BG = '#0f0f0f';
const SURFACE = '#1c1c1c';
const TEXT_PRIMARY = '#ededed';
const TEXT_SECONDARY = '#a0a0a0';
const ACCENT = '#3ECF8E';

export default function AnalyticsPage() {
  const dailySales = useMemo(() => generateDailySalesData(), []);
  const topItems = useMemo(() => generateTopItemsData(), []);
  const revenueByType = useMemo(() => generateRevenueByTypeData(), []);

  // Calculate summary metrics
  const totalRevenue = useMemo(
    () => dailySales.reduce((sum, d) => sum + d.sales, 0),
    [dailySales]
  );

  const avgDailySales = Math.round(totalRevenue / dailySales.length);

  const topItemRevenue = topItems.reduce((sum, item) => sum + item.sales, 0);

  return (
    <div style={{ backgroundColor: DARK_BG, color: TEXT_PRIMARY, padding: '2rem', minHeight: '100vh' }}>
      <h1 style={{ marginTop: 0, fontSize: '2rem', fontWeight: 700 }}>📊 Analytics</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <SummaryCard label="Total Revenue (30d)" value={`S/ ${(totalRevenue / 100).toFixed(2)}`} />
        <SummaryCard label="Avg Daily Sales" value={`S/ ${(avgDailySales / 100).toFixed(2)}`} />
        <SummaryCard label="Top Items Revenue" value={`S/ ${(topItemRevenue / 100).toFixed(2)}`} />
        <SummaryCard label="Order Types" value="4 tipos" />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Daily Sales Trend */}
        <ChartContainer title="💹 Daily Sales (Last 30 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySales} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke={TEXT_SECONDARY} style={{ fontSize: '12px' }} />
              <YAxis stroke={TEXT_SECONDARY} style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${ACCENT}`,
                  borderRadius: '4px',
                  color: TEXT_PRIMARY,
                }}
              />
              <Line type="monotone" dataKey="sales" stroke={ACCENT} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Top Items */}
        <ChartContainer title="🏆 Top Selling Items">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topItems} margin={{ top: 5, right: 30, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="name"
                stroke={TEXT_SECONDARY}
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke={TEXT_SECONDARY} style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${ACCENT}`,
                  borderRadius: '4px',
                  color: TEXT_PRIMARY,
                }}
              />
              <Bar dataKey="sales" fill={ACCENT} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Revenue by Type */}
      <ChartContainer title="🍕 Revenue by Category" style={{ maxWidth: '500px' }}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <Pie
              data={revenueByType}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: S/ ${(value / 100).toFixed(0)}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {revenueByType.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: SURFACE,
                border: `1px solid ${ACCENT}`,
                borderRadius: '4px',
                color: TEXT_PRIMARY,
              }}
              formatter={(value) => `S/ ${(value / 100).toFixed(2)}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Footer Note */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: SURFACE, borderLeft: `3px solid ${ACCENT}`, borderRadius: '4px', color: TEXT_SECONDARY, fontSize: '14px' }}>
        📌 In production, this dashboard syncs real-time data from PowerSync. Data shown here is mock for demo purposes.
      </div>
    </div>
  );
}

// Helper Components
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        backgroundColor: SURFACE,
        padding: '1.5rem',
        borderRadius: '8px',
        border: `1px solid #333`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: '14px', color: TEXT_SECONDARY, marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: ACCENT }}>{value}</div>
    </div>
  );
}

function ChartContainer({ title, children, style = {} }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: SURFACE,
        padding: '1.5rem',
        borderRadius: '8px',
        border: `1px solid #333`,
        ...style,
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: 600, color: ACCENT, marginBottom: '1rem' }}>{title}</h3>
      {children}
    </div>
  );
}
