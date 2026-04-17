import { getSubscriptionStatus } from '@saas-pos/domain';
import type { Tenant } from '@saas-pos/domain';

const DEMO_TENANTS: Tenant[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Bodega Doña Rosa',
    industry_type: 'retail',
    modules_config: { has_inventory: true, has_tables: false, has_appointments: false },
    valid_until: new Date(Date.now() + 20 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Restaurante El Sabor',
    industry_type: 'restaurant',
    modules_config: { has_inventory: true, has_tables: true, has_appointments: false },
    valid_until: new Date(Date.now() + 3 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  },
];

const INDUSTRY_LABEL: Record<string, string> = {
  retail:      '🛒 Retail',
  restaurant:  '🍽 Restaurante',
  barbershop:  '✂ Barbería',
};

export function TenantsPage() {
  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Tenants</h1>
          <p style={s.sub}>{DEMO_TENANTS.length} negocios activos</p>
        </div>
        <button style={s.primaryBtn}>+ Nuevo tenant</button>
      </div>

      <div style={s.grid}>
        {DEMO_TENANTS.map((tenant) => {
          const sub = getSubscriptionStatus(tenant);
          return (
            <div key={tenant.id} style={s.card}>
              {/* Card header */}
              <div style={s.cardHeader}>
                <div style={s.cardInitial}>
                  {tenant.name.slice(0, 1)}
                </div>
                <div>
                  <p style={s.cardName}>{tenant.name}</p>
                  <p style={s.cardIndustry}>{INDUSTRY_LABEL[tenant.industry_type]}</p>
                </div>
              </div>

              {/* Subscription */}
              <div style={{ ...s.subBadge, backgroundColor: sub.isActive ? (sub.isExpiringSoon ? '#2b1e0d' : '#0d2b1e') : '#2b0d0d', borderColor: sub.isActive ? (sub.isExpiringSoon ? '#F59E0B44' : '#3ECF8E33') : '#EF444433' }}>
                <span style={{ color: sub.isActive ? (sub.isExpiringSoon ? '#F59E0B' : '#3ECF8E') : '#EF4444', fontWeight: 600, fontSize: 12 }}>
                  {sub.isActive ? `${sub.daysRemaining} días restantes` : 'Suscripción vencida'}
                </span>
              </div>

              {/* Modules */}
              <div style={s.modules}>
                <p style={s.modulesTitle}>Módulos</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(tenant.modules_config).map(([key, active]) => (
                    <span key={key} style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                      backgroundColor: active ? '#1c2b1c' : '#1c1c1c',
                      color: active ? '#3ECF8E' : '#444',
                      border: `1px solid ${active ? '#2a4a2a' : '#272727'}`,
                    }}>
                      {key.replace('has_', '').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={s.cardActions}>
                <button style={s.ghostBtn}>Ver detalles</button>
                <button style={{ ...s.ghostBtn, color: '#3ECF8E', borderColor: '#3ECF8E44' }}>Renovar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:         { padding: '32px 40px', maxWidth: 1100 },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title:        { fontSize: 22, fontWeight: 700, color: '#ededed', letterSpacing: '-0.5px', margin: 0 },
  sub:          { fontSize: 13, color: '#555', marginTop: 4, margin: 0 },
  primaryBtn:   { backgroundColor: '#3ECF8E', color: '#0f0f0f', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 },
  card:         { backgroundColor: '#1c1c1c', border: '1px solid #272727', borderRadius: 10, padding: '20px 22px' },
  cardHeader:   { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  cardInitial:  { width: 40, height: 40, borderRadius: 8, backgroundColor: '#3ECF8E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#0f0f0f', flexShrink: 0 },
  cardName:     { fontSize: 15, fontWeight: 600, color: '#ededed', margin: 0 },
  cardIndustry: { fontSize: 12, color: '#555', marginTop: 2, margin: 0 },
  subBadge:     { padding: '8px 12px', borderRadius: 6, border: '1px solid', marginBottom: 16 },
  modules:      { marginBottom: 16 },
  modulesTitle: { fontSize: 10, color: '#555', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8, margin: '0 0 8px' },
  cardActions:  { display: 'flex', gap: 8 },
  ghostBtn:     { background: 'none', border: '1px solid #272727', borderRadius: 6, padding: '6px 14px', fontSize: 12, color: '#9b9b9b', cursor: 'pointer' },
};
