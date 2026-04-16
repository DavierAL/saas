/**
 * Web Dashboard — Admin Panel
 *
 * Design: Supabase-inspired dark theme
 *   bg: #0f0f0f  |  surface: #1c1c1c  |  border: #272727
 *   accent: #3ECF8E  |  text: #ededed  |  muted: #9b9b9b
 *   font: Inter, -apple-system, system-ui
 */
import { useState } from 'react';
import { formatMoney, createMoney } from '@saas-pos/domain';

// ─── Sidebar Nav ──────────────────────────────────────────────
type NavItem = {
  id: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',  label: 'Overview',   icon: '◼' },
  { id: 'catalog',   label: 'Catálogo',   icon: '◈' },
  { id: 'orders',    label: 'Órdenes',    icon: '◉' },
  { id: 'tenants',   label: 'Tenants',    icon: '◧' },
  { id: 'analytics', label: 'Analytics',  icon: '◫' },
  { id: 'settings',  label: 'Ajustes',    icon: '◬' },
];

function Sidebar({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <aside style={s.sidebar}>
      {/* Logo */}
      <div style={s.logo}>
        <div style={s.logoMark}>P</div>
        <span style={s.logoText}>SaaS POS</span>
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            style={{
              ...s.navItem,
              ...(active === item.id ? s.navItemActive : {}),
            }}
            onClick={() => onSelect(item.id)}
          >
            <span style={s.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={s.sidebarFooter}>
        <div style={s.syncDot} />
        <span style={s.sidebarFooterText}>Supabase · Conectado</span>
      </div>
    </aside>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({
  label, value, sub, accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div style={s.statCard}>
      <p style={s.statLabel}>{label}</p>
      <p style={{ ...s.statValue, ...(accent ? { color: '#3ECF8E' } : {}) }}>
        {value}
      </p>
      {sub && <p style={s.statSub}>{sub}</p>}
    </div>
  );
}

// ─── Overview Panel ───────────────────────────────────────────
function OverviewPanel() {
  const total = createMoney(0);

  // Sample data (Phase 2 will use real Supabase queries)
  const stats = [
    { label: 'Ventas hoy',      value: formatMoney(total),   sub: '0 órdenes',        accent: true },
    { label: 'Tenants activos', value: '1',                  sub: 'Plan activo'                    },
    { label: 'Productos',       value: '5',                  sub: 'En catálogo'                    },
    { label: 'Uptime Sync',     value: '100%',               sub: 'PowerSync OK'                   },
  ];

  return (
    <div style={s.panelContent}>
      <div style={s.panelHeader}>
        <h1 style={s.panelTitle}>Overview</h1>
        <div style={s.headerBadge}>
          <span style={s.badgeDot} />
          <span style={s.badgeText}>Sistema operativo</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={s.statsGrid}>
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Architecture info */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Stack · Fase 1 activa</h2>
        <div style={s.stackGrid}>
          {[
            { name: 'Supabase',    status: 'Configurar',  color: '#3ECF8E', desc: 'Auth + PostgreSQL + RLS' },
            { name: 'PowerSync',   status: 'Configurar',  color: '#F59E0B', desc: 'SQLite ↔ PostgreSQL sync' },
            { name: 'Turborepo',   status: 'Activo',      color: '#3ECF8E', desc: 'Monorepo build pipeline'  },
            { name: 'Expo',        status: 'Listo',       color: '#3ECF8E', desc: 'Mobile app + EAS'         },
          ].map((item) => (
            <div key={item.name} style={s.stackCard}>
              <div style={s.stackCardHeader}>
                <span style={s.stackName}>{item.name}</span>
                <span style={{ ...s.stackStatus, color: item.color }}>
                  {item.status}
                </span>
              </div>
              <p style={s.stackDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next steps */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Próximos pasos</h2>
        <div style={s.nextSteps}>
          {[
            { done: true,  text: 'Fase 0: Monorepo + dominio + packages' },
            { done: true,  text: 'Fase 1: Schema PostgreSQL + PowerSync schema + sync rules' },
            { done: false, text: 'Configurar proyecto en Supabase + correr schema.sql' },
            { done: false, text: 'Configurar PowerSync self-hosted (Docker / AWS ECS)' },
            { done: false, text: 'Conectar app mobile y probar sync offline→online' },
            { done: false, text: 'Fase 2: UI completa del POS (FlashList + carrito)' },
          ].map((step, i) => (
            <div key={i} style={s.step}>
              <span style={{ ...s.stepCheck, color: step.done ? '#3ECF8E' : '#444' }}>
                {step.done ? '✓' : '○'}
              </span>
              <span style={{ ...s.stepText, color: step.done ? '#ededed' : '#9b9b9b' }}>
                {step.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────
export function App() {
  const [activeNav, setActiveNav] = useState('overview');

  return (
    <div style={s.app}>
      <Sidebar active={activeNav} onSelect={setActiveNav} />
      <main style={s.main}>
        {activeNav === 'overview' && <OverviewPanel />}
        {activeNav \!== 'overview' && (
          <div style={s.comingSoon}>
            <p style={s.comingSoonText}>
              Módulo <strong style={{ color: '#ededed' }}>{activeNav}</strong> — Próximamente
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Styles (Supabase Design System) ─────────────────────────
const s: Record<string, React.CSSProperties> = {
  // Layout
  app: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#0f0f0f',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#ededed',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    overflow: 'auto',
  },

  // Sidebar
  sidebar: {
    width: 220,
    minWidth: 220,
    backgroundColor: '#0f0f0f',
    borderRight: '1px solid #1e1e1e',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 16px 16px',
    borderBottom: '1px solid #1e1e1e',
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#3ECF8E',
    color: '#0f0f0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 14,
  },
  logoText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#ededed',
    letterSpacing: '-0.2px',
  },
  nav: {
    flex: 1,
    padding: '8px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '7px 10px',
    borderRadius: 6,
    border: 'none',
    background: 'none',
    color: '#9b9b9b',
    fontSize: 13,
    fontWeight: 400,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.1s',
    width: '100%',
  },
  navItemActive: {
    backgroundColor: '#1c1c1c',
    color: '#ededed',
    fontWeight: 500,
  },
  navIcon: {
    fontSize: 11,
    opacity: 0.7,
  },
  sidebarFooter: {
    padding: '12px 16px',
    borderTop: '1px solid #1e1e1e',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#3ECF8E',
  },
  sidebarFooterText: {
    fontSize: 11,
    color: '#555',
  },

  // Panel
  panelContent: {
    padding: '32px 40px',
    maxWidth: 960,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#ededed',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  headerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 20,
    backgroundColor: '#0d2b1e',
    border: '1px solid #1a4a32',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#3ECF8E',
  },
  badgeText: {
    fontSize: 12,
    color: '#3ECF8E',
    fontWeight: 500,
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#1c1c1c',
    border: '1px solid #272727',
    borderRadius: 8,
    padding: '20px 20px',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    margin: '0 0 8px',
    fontWeight: 500,
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 26,
    fontWeight: 700,
    color: '#ededed',
    letterSpacing: '-0.5px',
    margin: '0 0 4px',
  },
  statSub: {
    fontSize: 12,
    color: '#555',
    margin: 0,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#9b9b9b',
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    marginBottom: 12,
    margin: '0 0 12px',
  },

  // Stack grid
  stackGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  stackCard: {
    backgroundColor: '#1c1c1c',
    border: '1px solid #272727',
    borderRadius: 8,
    padding: '16px 18px',
  },
  stackCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stackName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#ededed',
  },
  stackStatus: {
    fontSize: 12,
    fontWeight: 500,
  },
  stackDesc: {
    fontSize: 12,
    color: '#555',
    margin: 0,
  },

  // Next steps
  nextSteps: {
    backgroundColor: '#1c1c1c',
    border: '1px solid #272727',
    borderRadius: 8,
    padding: '4px 0',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 18px',
    borderBottom: '1px solid #1e1e1e',
  },
  stepCheck: {
    fontSize: 14,
    fontWeight: 700,
    minWidth: 16,
  },
  stepText: {
    fontSize: 13,
  },

  // Coming soon
  comingSoon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#555',
  },
  comingSoonText: {
    fontSize: 15,
  },
};
