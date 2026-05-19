import { useMemo } from "react";
import type { CSSProperties } from "react";

import { useTenantId } from "../hooks/useTenantId";
import { useTenant } from "../hooks/useTenant";
import { useInventory } from "../hooks/useInventory";
import { InventoryTable } from "../components/inventory";
import { PageIcon } from "../components/PageIcon";

export default function InventoryPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const { tenant } = useTenant(tenantId ?? null);
  const { items, lowStockItems, loading, error, clearError } = useInventory(tenantId ?? null);

  const stats = useMemo(() => {
    const totalProducts = items.filter(i => i.stock !== null).length;
    const totalServices = items.filter(i => i.stock === null).length;
    const outOfStock = items.filter(i => i.stock === 0).length;
    const totalItems = items.length;
    return { totalProducts, totalServices, outOfStock, totalItems };
  }, [items]);

  const allAreServices = items.length > 0 && items.every(i => i.type === "service");

  if (tenantLoading || loading) {
    return (
      <div style={s.page}>
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <p>Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {error && (
        <div style={s.errorBanner}>
          <span>{error}</span>
          <button onClick={clearError} style={s.errorBtn}>✕</button>
        </div>
      )}

      <header style={s.header}>
        <div>
          <h1 style={s.title}><PageIcon name="inventory" />Inventario</h1>
          <p style={s.subtitle}>{tenant?.name || 'Mi negocio'} · {stats.totalItems} items</p>
        </div>
        <button style={s.addBtn}>
          + Agregar
        </button>
      </header>

      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statValue}>{stats.totalProducts}</div>
          <div style={s.statLabel}>Productos</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: '#818CF8' }}>{stats.totalServices}</div>
          <div style={s.statLabel}>Servicios</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: '#F59E0B' }}>{lowStockItems.length}</div>
          <div style={s.statLabel}>Stock Bajo</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statValue, color: '#EF4444' }}>{stats.outOfStock}</div>
          <div style={s.statLabel}>Sin Stock</div>
        </div>
      </div>

      {allAreServices ? (
        <div style={s.noticeBox}>
          <span>Modo Servicios: Los campos de inventario están ocultos</span>
        </div>
      ) : null}

      <section style={s.section}>
        <h2 style={s.sectionTitle}>
          {allAreServices ? 'Catálogo de Servicios' : 'Inventario Actual'}
        </h2>
        <InventoryTable items={items} industryType={tenant?.industry_type} />
      </section>

      {lowStockItems.length > 0 && !allAreServices && (
        <section style={s.section}>
          <h2 style={s.alertsTitle}>
          <PageIcon name="stockAlert" />
          Alertas de Stock
          </h2>
          <div style={s.alertsGrid}>
            {lowStockItems.slice(0, 6).map(item => (
              <div key={item.id} style={s.alertCard}>
                <div style={s.alertInfo}>
                  <span style={s.alertName}>{item.name}</span>
                  <span style={s.alertCategory}>{item.category || 'Sin categoría'}</span>
                </div>
                <div style={s.alertStock}>
                  <span style={s.alertStockValue}>{item.stock}</span>
                  <span style={s.alertStockLabel}>unds</span>
                </div>
              </div>
            ))}
            {lowStockItems.length > 6 && (
              <div style={s.moreAlert}>+{lowStockItems.length - 6} más</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: {
    padding: '32px 40px',
    maxWidth: 1200,
    margin: '0 auto',
    backgroundColor: 'var(--bg-primary)',
    minHeight: '100vh',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 16,
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid var(--border-color)',
    borderTopColor: 'var(--accent-color)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-muted)',
    margin: '4px 0 0',
  },
  addBtn: {
    backgroundColor: 'var(--accent-color)',
    color: '#0f0f0f',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 10,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  statValue: {
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginTop: 2,
  },
  noticeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 20,
    fontSize: 14,
    color: 'var(--accent-color)',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 16px',
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  alertsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  },
  alertCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--warning-border)',
    borderRadius: 8,
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  alertName: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  alertCategory: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  alertStock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  alertStockValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#F59E0B',
  },
  alertStockLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  moreAlert: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px dashed var(--border-color)',
    borderRadius: 8,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  errorBanner: {
    backgroundColor: 'var(--error-bg)',
    border: '1px solid var(--error-border)',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 20,
    color: 'var(--error-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
  },
  errorBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--error-color)',
    cursor: 'pointer',
    fontSize: 16,
    opacity: 0.7,
  },
};