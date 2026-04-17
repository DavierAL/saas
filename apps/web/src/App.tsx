import { useState } from 'react';
import { CatalogPage } from './pages/CatalogPage';
import { OrdersPage } from './pages/OrdersPage';
import { TenantsPage } from './pages/TenantsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import InventoryPage from './pages/InventoryPage';
import { formatMoney, createMoney } from '@saas-pos/domain';

type NavId = 'overview' | 'catalog' | 'orders' | 'tenants' | 'analytics' | 'inventory' | 'settings';

const NAV = [
  { id: 'overview' as NavId,   icon: '◼', label: 'Overview'    },
  { id: 'catalog'  as NavId,   icon: '◈', label: 'Catálogo'    },
  { id: 'orders'   as NavId,   icon: '◉', label: 'Órdenes'     },
  { id: 'tenants'  as NavId,   icon: '◧', label: 'Tenants'     },
  { id: 'analytics'as NavId,   icon: '◫', label: 'Analytics'   },
  { id: 'inventory'as NavId,   icon: '◪', label: 'Inventario'  },
  { id: 'settings' as NavId,   icon: '◬', label: 'Ajustes'     },
];

function Sidebar({ active, onSelect }: { active: NavId; onSelect: (id: NavId) => void }) {
  return (
    <aside style={s.sidebar}>
      <div style={s.logo}>
        <div style={s.logoMark}>P</div>
        <span style={s.logoText}>SaaS POS</span>
      </div>
      <nav style={s.nav}>
        {NAV.map((item) => (
          <button
            key={item.id}
            style={{ ...s.navItem, ...(active === item.id ? s.navActive : {}) }}
            onClick={() => onSelect(item.id)}
          >
            <span style={s.navIcon}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={s.sidebarBottom}>
        <div style={s.syncRow}>
          <span style={s.syncDot} />
          <span style={s.syncText}>Supabase · Online</span>
        </div>
      </div>
    </aside>
  );
}

function OverviewPage() {
  return (
    <div style={s.pageContent}>
      <div style={s.pageHead}>
        <h1 style={s.pageTitle}>Overview</h1>
        <span style={s.activeBadge}><span style={s.activeDot}/>Sistema operativo</span>
      </div>
      <div style={s.statGrid}>
        {[
          { label: 'Ventas hoy',     value: formatMoney(createMoney(2410)), accent: true  },
          { label: 'Órdenes hoy',    value: '3',                             accent: false },
          { label: 'Tenants activos',value: '1',                             accent: false },
          { label: 'Sync status',    value: 'OK',                            accent: true  },
        ].map((item) => (
          <div key={item.label} style={s.statCard}>
            <p style={s.statLabel}>{item.label}</p>
            <p style={{ ...s.statValue, ...(item.accent ? { color: '#3ECF8E' } : {}) }}>{item.value}</p>
          </div>
        ))}
      </div>
      <div style={s.sectionWrap}>
        <h2 style={s.sectionTitle}>Estado del sistema</h2>
        <div style={s.stackTable}>
          {[
            { name: 'Turborepo',  status: '✓ Activo',      ok: true,  desc: 'Monorepo + build pipeline' },
            { name: 'Supabase',   status: '⚙ Configurar', ok: false, desc: 'Auth + PostgreSQL + RLS' },
            { name: 'PowerSync',  status: '⚙ Configurar', ok: false, desc: 'SQLite ↔ Postgres sync' },
            { name: 'Expo EAS',   status: '✓ Listo',       ok: true,  desc: 'Mobile build + OTA updates' },
          ].map((item) => (
            <div key={item.name} style={s.stackRow}>
              <span style={s.stackName}>{item.name}</span>
              <span style={s.stackDesc}>{item.desc}</span>
              <span style={{ color: item.ok ? '#3ECF8E' : '#F59E0B', fontWeight: 600, fontSize: 12 }}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function App() {
  const [active, setActive] = useState<NavId>('overview');

  const content = {
    overview:   <OverviewPage />,
    catalog:    <CatalogPage />,
    orders:     <OrdersPage />,
    tenants:    <TenantsPage />,
    analytics:  <AnalyticsPage />,
    inventory:  <InventoryPage />,
    settings:   <ComingSoon label="Ajustes" />,
  }[active];

  return (
    <div style={s.app}>
      <Sidebar active={active} onSelect={setActive} />
      <main style={s.main}>{content}</main>
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ color: '#555', fontSize: 14 }}>
        <strong style={{ color: '#ededed' }}>{label}</strong> — Próximamente
      </p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  app:          { display: 'flex', height: '100vh', backgroundColor: '#0f0f0f', fontFamily: 'Inter, -apple-system, system-ui, sans-serif', color: '#ededed', overflow: 'hidden' },
  main:         { flex: 1, overflow: 'auto' },
  sidebar:      { width: 216, minWidth: 216, backgroundColor: '#0f0f0f', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column' },
  logo:         { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 16px', borderBottom: '1px solid #1e1e1e' },
  logoMark:     { width: 28, height: 28, borderRadius: 6, backgroundColor: '#3ECF8E', color: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 },
  logoText:     { fontSize: 14, fontWeight: 600, color: '#ededed', letterSpacing: '-0.2px' },
  nav:          { flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem:      { display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 6, border: 'none', background: 'none', color: '#555', fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.1s' },
  navActive:    { backgroundColor: '#1c1c1c', color: '#ededed', fontWeight: 500 },
  navIcon:      { fontSize: 11, opacity: 0.7 },
  sidebarBottom:{ padding: '12px 16px', borderTop: '1px solid #1e1e1e' },
  syncRow:      { display: 'flex', alignItems: 'center', gap: 8 },
  syncDot:      { width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3ECF8E' },
  syncText:     { fontSize: 11, color: '#444' },
  pageContent:  { padding: '32px 40px', maxWidth: 1000 },
  pageHead:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  pageTitle:    { fontSize: 22, fontWeight: 700, color: '#ededed', letterSpacing: '-0.5px', margin: 0 },
  activeBadge:  { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, backgroundColor: '#0d2b1e', border: '1px solid #1a4a32', fontSize: 12, color: '#3ECF8E', fontWeight: 500 },
  activeDot:    { width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3ECF8E' },
  statGrid:     { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  statCard:     { backgroundColor: '#1c1c1c', border: '1px solid #272727', borderRadius: 8, padding: '18px 20px' },
  statLabel:    { fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.3px', textTransform: 'uppercase', margin: '0 0 8px' },
  statValue:    { fontSize: 26, fontWeight: 700, color: '#ededed', letterSpacing: '-0.5px', margin: 0 },
  sectionWrap:  { marginBottom: 28 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: '#555', letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 12px' },
  stackTable:   { backgroundColor: '#1c1c1c', border: '1px solid #272727', borderRadius: 8, overflow: 'hidden' },
  stackRow:     { display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px', borderBottom: '1px solid #1e1e1e' },
  stackName:    { fontSize: 14, fontWeight: 600, color: '#ededed', minWidth: 110 },
  stackDesc:    { flex: 1, fontSize: 13, color: '#555' },
};
