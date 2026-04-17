import { useState, useEffect } from 'react';
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

function Sidebar({ active, onSelect, isOpen, onClose }: { active: NavId; onSelect: (id: NavId) => void; isOpen: boolean; onClose: () => void }) {
  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div style={s.logo}>
          <div style={s.logoMark}>P</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>SaaS POS</span>
        </div>
        <nav style={s.nav}>
          {NAV.map((item) => (
            <button
              key={item.id}
              style={{ ...s.navItem, ...(active === item.id ? s.navActive : {}) }}
              onClick={() => { onSelect(item.id); onClose(); }}
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
    </>
  );
}

function OverviewPage() {
  return (
    <div style={s.pageContent}>
      <div style={s.pageHead}>
        <h1 style={s.pageTitle}>Overview</h1>
        <span style={s.activeBadge}><span style={s.activeDot}/>Sistema operativo</span>
      </div>
      <div className="stat-grid" style={s.statGrid}>
        {[
          { label: 'Ventas hoy',     value: formatMoney(createMoney(2410, 'PEN')), accent: true  },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  let content;
  if (active === 'settings') {
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Ajustes</strong> — En construcción
        </p>
        <button 
          onClick={toggleTheme}
          style={{ background: 'var(--accent-bg)', color: 'var(--accent-color)', border: '1px solid var(--accent-border)', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
        >
          Cambiar a Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}
        </button>
      </div>
    );
  } else {
    content = {
      overview:   <OverviewPage />,
      catalog:    <CatalogPage />,
      orders:     <OrdersPage />,
      tenants:    <TenantsPage />,
      analytics:  <AnalyticsPage />,
      inventory:  <InventoryPage />,
    }[active];
  }

  return (
    <div className="app-container">
      <Sidebar active={active} onSelect={setActive} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="main-content">
        <header className="mobile-header">
          <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
          <span style={{ fontWeight: 600 }}>SaaS POS</span>
          <div style={{ width: 32 }} /> {/* spacer */}
        </header>
        <main className="page-wrapper">{content}</main>
      </div>
    </div>
  );
}
// ComingSoon removed

const s: Record<string, React.CSSProperties> = {
  // Most layout moved to index.css. Kept remaining component-specific styles updated to use CSS variables.
  logo:         { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 16px', borderBottom: '1px solid var(--border-light)' },
  logoMark:     { width: 28, height: 28, borderRadius: 6, backgroundColor: 'var(--accent-color)', color: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 },
  nav:          { flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem:      { display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 6, border: 'none', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.1s' },
  navActive:    { backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600, border: '1px solid var(--border-color)' },
  navIcon:      { fontSize: 11, opacity: 0.7 },
  sidebarBottom:{ padding: '12px 16px', borderTop: '1px solid var(--border-light)' },
  syncRow:      { display: 'flex', alignItems: 'center', gap: 8 },
  syncDot:      { width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-color)' },
  syncText:     { fontSize: 11, color: 'var(--text-muted)' },
  pageContent:  { width: '100%' },
  pageHead:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  pageTitle:    { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 },
  activeBadge:  { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, backgroundColor: 'var(--accent-bg)', border: '1px solid var(--accent-border)', fontSize: 12, color: 'var(--accent-color)', fontWeight: 500 },
  activeDot:    { width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-color)' },
  statGrid:     { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  statCard:     { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '18px 20px' },
  statLabel:    { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.3px', textTransform: 'uppercase', margin: '0 0 8px' },
  statValue:    { fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 },
  sectionWrap:  { marginBottom: 28 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 12px' },
  stackTable:   { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' },
  stackRow:     { display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px', borderBottom: '1px solid var(--border-light)' },
  stackName:    { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', minWidth: 110 },
  stackDesc:    { flex: 1, fontSize: 13, color: 'var(--text-secondary)' },
};
