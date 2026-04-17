import { useState, useEffect } from 'react';
import { getSubscriptionStatus } from '@saas-pos/domain';
import type { Tenant } from '@saas-pos/domain';
import { supabase } from '../lib/supabase';

const INDUSTRY_LABEL: Record<string, string> = {
  retail:      '🛒 Retail',
  restaurant:  '🍽 Restaurante',
  barbershop:  '✂ Barbería',
};

export function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('tenants').select('*')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setTenants(data as unknown as Tenant[]);
        setLoading(false);
      });
  }, []);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Tenants</h1>
          <p style={s.sub}>{loading ? 'Cargando...' : `${tenants.length} negocios activos`}</p>
        </div>
        <button style={s.primaryBtn}>+ Nuevo tenant</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#555' }}>
          <p>Cargando tenants...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#EF4444' }}>
          <p>Error: {error}</p>
        </div>
      ) : (
      <div style={s.grid}>
        {tenants.map((tenant) => {
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
              <div style={{ ...s.subBadge, backgroundColor: sub.isActive ? (sub.isExpiringSoon ? 'var(--warning-color)' : 'var(--accent-bg)') : 'transparent', borderColor: sub.isActive ? (sub.isExpiringSoon ? 'var(--warning-color)' : 'var(--accent-border)') : 'var(--error-color)', opacity: sub.isActive ? (sub.isExpiringSoon ? 0.2 : 1) : 0.4 }}>
                <span style={{ color: sub.isActive ? (sub.isExpiringSoon ? 'var(--warning-color)' : 'var(--accent-color)') : 'var(--error-color)', fontWeight: 600, fontSize: 12 }}>
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
                      backgroundColor: active ? 'var(--accent-bg)' : 'transparent',
                      color: active ? 'var(--accent-color)' : 'var(--text-muted)',
                      border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border-color)'}`,
                    }}>
                      {key.replace('has_', '').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={s.cardActions}>
                <button style={s.ghostBtn}>Ver detalles</button>
                <button style={{ ...s.ghostBtn, color: 'var(--accent-color)', borderColor: 'var(--accent-border)' }}>Renovar</button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:         { padding: '32px 40px', maxWidth: 1100 },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title:        { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 },
  sub:          { fontSize: 13, color: 'var(--text-muted)', marginTop: 4, margin: 0 },
  primaryBtn:   { backgroundColor: 'var(--accent-color)', color: '#0f0f0f', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 },
  card:         { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '20px 22px' },
  cardHeader:   { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  cardInitial:  { width: 40, height: 40, borderRadius: 8, backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#0f0f0f', flexShrink: 0 },
  cardName:     { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 },
  cardIndustry: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2, margin: 0 },
  subBadge:     { padding: '8px 12px', borderRadius: 6, border: '1px solid', marginBottom: 16 },
  modules:      { marginBottom: 16 },
  modulesTitle: { fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8, margin: '0 0 8px' },
  cardActions:  { display: 'flex', gap: 8 },
  ghostBtn:     { background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '6px 14px', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' },
};
