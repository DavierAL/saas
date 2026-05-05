import { useState, useEffect } from "react";
import { useTenantId } from "../hooks/useTenantId";
import { supabase } from "../lib/supabase";

const DEFAULT_METHODS = [
  { name: "Efectivo", type: "cash" },
  { name: "Yape", type: "yape" },
  { name: "Plin", type: "plin" },
  { name: "Tarjeta", type: "card" },
  { name: "Transferencia", type: "transfer" },
];

export default function PaymentMethodsPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMethod, setNewMethod] = useState({ name: "", type: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    async function fetch() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("name");
        setMethods(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [tenantId]);

  const handleToggle = async (id: string, isActive: boolean) => {
    await supabase.from("payment_methods").update({ is_active: !isActive }).eq("id", id);
    setMethods(methods.map((m) => (m.id === id ? { ...m, is_active: !isActive } : m)));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("payment_methods").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    setMethods(methods.filter((m) => m.id !== id));
  };

  const handleCreate = async () => {
    if (!newMethod.name || !newMethod.type || !tenantId) return;
    setCreating(true);
    try {
      const { data } = await supabase
        .from("payment_methods")
        .insert({ ...newMethod, tenant_id: tenantId, is_active: true, config: {} })
        .select()
        .single();
      if (data) setMethods([...methods, data]);
      setNewMethod({ name: "", type: "" });
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  if (tenantLoading || loading) {
    return <div style={s.page}><h1 style={s.title}>Métodos de Pago</h1><p style={s.loading}>Cargando...</p></div>;
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Métodos de Pago</h1>

      <div style={s.section}>
        <h2 style={s.sectionTitle}>Métodos Activos</h2>
        {methods.length === 0 ? (
          <p style={s.empty}>No hay métodos configurados</p>
        ) : (
          <div style={s.grid}>
            {methods.map((m) => (
              <div key={m.id} style={s.card}>
                <div style={s.cardHeader}>
                  <span style={s.cardName}>{m.name}</span>
                  <label style={s.toggle}>
                    <input type="checkbox" checked={m.is_active} onChange={() => handleToggle(m.id, m.is_active)} />
                    <span style={s.toggleSwitch} />
                  </label>
                </div>
                <span style={s.cardType}>{m.type}</span>
                <button onClick={() => handleDelete(m.id)} style={s.deleteBtn}>Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={s.section}>
        <h2 style={s.sectionTitle}>Agregar Método</h2>
        <div style={s.addForm}>
          <input
            placeholder="Nombre"
            value={newMethod.name}
            onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
            style={s.input}
          />
          <select
            value={newMethod.type}
            onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value })}
            style={s.select}
          >
            <option value="">Seleccionar tipo</option>
            {DEFAULT_METHODS.map((t) => (
              <option key={t.type} value={t.type}>{t.name}</option>
            ))}
            <option value="custom">Personalizado</option>
          </select>
          <button onClick={handleCreate} disabled={creating || !newMethod.name || !newMethod.type} style={s.addBtn}>
            {creating ? "Agregando..." : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { width: "100%", maxWidth: 800, padding: "0 32px" },
  title: { fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px" },
  loading: { color: "var(--text-muted)", textAlign: "center", padding: 40 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 12 },
  empty: { color: "var(--text-muted)", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 },
  card: { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 8 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardName: { fontSize: 14, fontWeight: 600, color: "var(--text-primary)" },
  cardType: { fontSize: 12, color: "var(--text-muted)" },
  toggle: { position: "relative", width: 36, height: 20, cursor: "pointer" },
  toggleSwitch: { position: "absolute", inset: 0, backgroundColor: "var(--bg-elevated)", borderRadius: 10, transition: "0.2s" },
  deleteBtn: { padding: "6px 12px", borderRadius: 4, border: "1px solid var(--error-border)", backgroundColor: "transparent", color: "var(--error-color)", fontSize: 11, fontWeight: 600, cursor: "pointer", marginTop: "auto" },
  addForm: { display: "flex", gap: 12 },
  input: { flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", fontSize: 14 },
  select: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", fontSize: 14 },
  addBtn: { padding: "8px 20px", borderRadius: 6, border: "none", backgroundColor: "var(--accent-color)", color: "#0f0f0f", fontWeight: 600, fontSize: 14, cursor: "pointer" },
};