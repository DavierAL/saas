import { useState, useEffect } from 'react';
import type { Order } from '@saas-pos/domain';
import { formatMoney, createMoney } from '@saas-pos/domain';
import { useCases } from '../lib/use-cases';

const FIXED_TENANT_ID = '00000000-0000-0000-0000-000000000000'; // TODO: Get from context/auth

const STATUS = {
  paid:               { label: 'Pagado',    color: '#3ECF8E', bg: '#0d2b1e' },
  pending:            { label: 'Pendiente', color: '#F59E0B', bg: '#2b1e0d' },
  cancelled:          { label: 'Cancelado', color: '#EF4444', bg: '#2b0d0d' },
  refunded:           { label: 'Reembolsado',color: '#818CF8', bg: '#14143b' },
  partially_refunded: { label: 'Reem. Parcial',color: '#818CF8', bg: '#14143b' },
  voided:             { label: 'Anulado',   color: '#9b9b9b', bg: '#1c1c1c' },
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    useCases.orders.findByTenant(FIXED_TENANT_ID)
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar las órdenes');
        setLoading(false);
      });
  }, []);

  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total_amount, 0);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Órdenes</h1>
          <p style={s.sub}>{loading ? 'Cargando...' : `${orders.length} órdenes registradas`}</p>
        </div>
      </div>

      {/* Summary */}
      <div style={s.statsGrid}>
        {[
          { label: 'Total vendido',   value: formatMoney(createMoney(totalRevenue, orders[0]?.currency || 'PEN')), accent: true },
          { label: 'Órdenes pagadas', value: String(orders.filter(o => o.status === 'paid').length), accent: false },
          { label: 'Canceladas',      value: String(orders.filter(o => o.status === 'cancelled').length), accent: false },
        ].map(item => (
          <div key={item.label} style={s.statCard}>
            <p style={s.statLabel}>{item.label}</p>
            <p style={{ ...s.statValue, ...(item.accent ? { color: '#3ECF8E' } : {}) }}>{item.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#555' }}>
          <p>Cargando órdenes...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#EF4444' }}>
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
              <th style={{ ...s.th, textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const cfg = STATUS[order.status] || STATUS.cancelled;
              const d = new Date(order.created_at);
              return (
                <tr key={order.id} style={s.tr} onMouseEnter={e => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--bg-hover)')} onMouseLeave={e => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent')}>
                  <td style={s.td}>
                    <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td style={s.td}>{d.toLocaleDateString('es-PE')} {d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={s.td}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right', color: 'var(--accent-color)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatMoney(createMoney(order.total_amount, order.currency))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:       { padding: '32px 40px', maxWidth: 960 },
  header:     { display: 'flex', justifyContent: 'space-between', marginBottom: 24 },
  title:      { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 },
  sub:        { fontSize: 13, color: 'var(--text-muted)', marginTop: 4, margin: 0 },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  statCard:   { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '18px 20px' },
  statLabel:  { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 8px' },
  statValue:  { fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 },
  tableWrap:  { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { padding: '10px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border-color)', letterSpacing: '0.4px', textTransform: 'uppercase' },
  tr:         { transition: 'background 0.1s' },
  td:         { padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)' },
};
