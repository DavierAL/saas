import type { Order } from '@saas-pos/domain';
import { formatMoney, createMoney } from '@saas-pos/domain';

const DEMO_ORDERS: Order[] = [
  { id: 'a1b2c3d4-0000-0000-0000-000000000001', tenant_id: 't1', user_id: 'u1', status: 'paid',      total_amount: 980,  created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'a1b2c3d4-0000-0000-0000-000000000002', tenant_id: 't1', user_id: 'u1', status: 'paid',      total_amount: 1430, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
  { id: 'a1b2c3d4-0000-0000-0000-000000000003', tenant_id: 't1', user_id: 'u1', status: 'cancelled', total_amount: 350,  created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null },
];

const STATUS = {
  paid:      { label: 'Pagado',    color: '#3ECF8E', bg: '#0d2b1e' },
  pending:   { label: 'Pendiente', color: '#F59E0B', bg: '#2b1e0d' },
  cancelled: { label: 'Cancelado', color: '#EF4444', bg: '#2b0d0d' },
};

export function OrdersPage() {
  const totalRevenue = DEMO_ORDERS.filter(o => o.status === 'paid').reduce((s, o) => s + o.total_amount, 0);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Órdenes</h1>
          <p style={s.sub}>{DEMO_ORDERS.length} órdenes registradas</p>
        </div>
      </div>

      {/* Summary */}
      <div style={s.statsGrid}>
        {[
          { label: 'Total vendido',   value: formatMoney(createMoney(totalRevenue)), accent: true },
          { label: 'Órdenes pagadas', value: String(DEMO_ORDERS.filter(o => o.status === 'paid').length), accent: false },
          { label: 'Canceladas',      value: String(DEMO_ORDERS.filter(o => o.status === 'cancelled').length), accent: false },
        ].map(item => (
          <div key={item.label} style={s.statCard}>
            <p style={s.statLabel}>{item.label}</p>
            <p style={{ ...s.statValue, ...(item.accent ? { color: '#3ECF8E' } : {}) }}>{item.value}</p>
          </div>
        ))}
      </div>

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
            {DEMO_ORDERS.map((order) => {
              const cfg = STATUS[order.status];
              const d = new Date(order.created_at);
              return (
                <tr key={order.id} style={s.tr} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#161616')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td style={s.td}>
                    <span style={{ fontFamily: '"Geist Mono", monospace', fontSize: 12, color: '#9b9b9b' }}>
                      {order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td style={s.td}>{d.toLocaleDateString('es-PE')} {d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={s.td}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right', color: '#3ECF8E', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {formatMoney(createMoney(order.total_amount))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:       { padding: '32px 40px', maxWidth: 960 },
  header:     { display: 'flex', justifyContent: 'space-between', marginBottom: 24 },
  title:      { fontSize: 22, fontWeight: 700, color: '#ededed', letterSpacing: '-0.5px', margin: 0 },
  sub:        { fontSize: 13, color: '#555', marginTop: 4, margin: 0 },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  statCard:   { backgroundColor: '#1c1c1c', border: '1px solid #272727', borderRadius: 8, padding: '18px 20px' },
  statLabel:  { fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 8px' },
  statValue:  { fontSize: 24, fontWeight: 700, color: '#ededed', letterSpacing: '-0.5px', margin: 0 },
  tableWrap:  { backgroundColor: '#1c1c1c', border: '1px solid #272727', borderRadius: 8, overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#555', textAlign: 'left', borderBottom: '1px solid #272727', letterSpacing: '0.4px', textTransform: 'uppercase' },
  tr:         { transition: 'background 0.1s' },
  td:         { padding: '12px 16px', fontSize: 13, color: '#9b9b9b', borderBottom: '1px solid #1e1e1e' },
};
