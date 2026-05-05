import { useState } from "react";
import { getSubscriptionStatus } from "@saas-pos/domain";
import type { Tenant } from "@saas-pos/domain";
import { useTenant } from "../hooks/useTenant";
import { useTenantId } from "../hooks/useTenantId";

function StatusBadge({ tenant }: { tenant: Tenant }) {
  const status = getSubscriptionStatus(tenant, 7);

  if (!status.isActive) {
    return (
      <span style={{ ...s.badge, backgroundColor: "var(--error-bg)", color: "var(--error-color)", border: "1px solid var(--error-border)" }}>
        Expirado
      </span>
    );
  }

  if (status.isExpiringSoon) {
    return (
      <span style={{ ...s.badge, backgroundColor: "var(--warning-bg)", color: "var(--warning-color)", border: "1px solid var(--warning-border)" }}>
        Expira en {status.daysRemaining} días
      </span>
    );
  }

  return (
    <span style={{ ...s.badge, backgroundColor: "var(--success-bg)", color: "var(--success-color)", border: "1px solid var(--success-border)" }}>
      Activo
    </span>
  );
}

function ModuleCard({ name, active, icon }: { name: string; active: boolean; icon: string }) {
  return (
    <div style={{ ...s.moduleCard, opacity: active ? 1 : 0.4 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: active ? "var(--text-primary)" : "var(--text-muted)" }}>
        {name}
      </span>
      <span style={{ fontSize: 16, color: active ? "var(--success-color)" : "var(--text-muted)" }}>
        {active ? "✓" : "✗"}
      </span>
    </div>
  );
}

function RenewModal({ onClose, currency }: { onClose: () => void; currency: string }) {
  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
          Renovar Suscripción
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Para renovar tu plan, realiza el pago manual por uno de estos medios y envía el comprobante a soporte:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <div style={s.paymentMethod}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Yape</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>+51 999 888 777</span>
          </div>
          <div style={s.paymentMethod}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Plin</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>+51 999 888 777</span>
          </div>
          <div style={s.paymentMethod}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Transferencia Bancaria</span>
            <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              BCP: 191-1234567-0-89 | {currency}
            </span>
          </div>
        </div>
        <button onClick={onClose} style={s.closeBtn}>Entendido</button>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const { tenantId, loading: tenantIdLoading } = useTenantId();
  const { tenant, loading, error } = useTenant(tenantId);
  const [showRenewModal, setShowRenewModal] = useState(false);

  if (tenantIdLoading || loading) {
    return (
      <div style={s.pageContent}>
        <div style={s.pageHead}>
          <h1 style={s.pageTitle}>Suscripción</h1>
        </div>
        <div style={s.loadingWrap}>Cargando...</div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div style={s.pageContent}>
        <div style={s.pageHead}>
          <h1 style={s.pageTitle}>Suscripción</h1>
        </div>
        <div style={s.errorWrap}>{error || "No se encontró información del tenant"}</div>
      </div>
    );
  }

  const status = getSubscriptionStatus(tenant, 7);
  const modules = [
    { name: "Inventario", active: tenant.modules_config.has_inventory, icon: "📦" },
    { name: "Mesas", active: tenant.modules_config.has_tables, icon: "🪑" },
    { name: "Citas", active: tenant.modules_config.has_appointments, icon: "📅" },
  ];

  const validUntilDate = new Date(tenant.valid_until);
  const formattedDate = validUntilDate.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={s.pageContent}>
      <div style={s.pageHead}>
        <h1 style={s.pageTitle}>Suscripción</h1>
        <StatusBadge tenant={tenant} />
      </div>

      <div style={s.grid}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>Plan Actual</h3>
          <div style={s.metric}>
            <span style={s.metricLabel}>Estado</span>
            <span style={{ ...s.metricValue, color: status.isActive ? (status.isExpiringSoon ? "var(--warning-color)" : "var(--success-color)") : "var(--error-color)" }}>
              {status.isActive ? (status.isExpiringSoon ? "Por expirar" : "Activo") : "Expirado"}
            </span>
          </div>
          <div style={s.metric}>
            <span style={s.metricLabel}>Expira el</span>
            <span style={s.metricValue}>{formattedDate}</span>
          </div>
          <div style={s.metric}>
            <span style={s.metricLabel}>Días restantes</span>
            <span style={s.metricValue}>{status.daysRemaining}</span>
          </div>
          <div style={s.metric}>
            <span style={s.metricLabel}>Moneda</span>
            <span style={s.metricValue}>{tenant.currency}</span>
          </div>
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>Módulos Activos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {modules.map((m) => (
              <ModuleCard key={m.name} {...m} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => setShowRenewModal(true)}
          style={s.renewBtn}
        >
          Renovar Suscripción
        </button>
      </div>

      {showRenewModal && (
        <RenewModal onClose={() => setShowRenewModal(false)} currency={tenant.currency} />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  pageContent: { width: "100%", maxWidth: 800 },
  pageHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", margin: 0 },
  loadingWrap: { padding: 40, textAlign: "center", color: "var(--text-muted)" },
  errorWrap: { padding: 40, textAlign: "center", color: "var(--error-color)" },
  badge: { padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  card: { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "20px 24px" },
  cardTitle: { fontSize: 13, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.4px", textTransform: "uppercase", margin: "0 0 16px" },
  metric: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-light)" },
  metricLabel: { fontSize: 13, color: "var(--text-secondary)" },
  metricValue: { fontSize: 14, fontWeight: 600, color: "var(--text-primary)" },
  moduleCard: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", backgroundColor: "var(--bg-elevated)", borderRadius: 6, border: "1px solid var(--border-light)" },
  renewBtn: { backgroundColor: "var(--accent-color)", color: "#0f0f0f", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 10, padding: 24, width: "90%", maxWidth: 420 },
  paymentMethod: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", backgroundColor: "var(--bg-elevated)", borderRadius: 6, border: "1px solid var(--border-light)" },
  closeBtn: { width: "100%", padding: "10px", backgroundColor: "var(--accent-bg)", color: "var(--accent-color)", border: "1px solid var(--accent-border)", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
};
