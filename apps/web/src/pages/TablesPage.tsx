import { useState, useEffect } from "react";
import { useTenantId } from "../hooks/useTenantId";
import { supabase } from "../lib/supabase";

interface Table {
  id: string;
  number: number;
  name?: string;
  status: 'free' | 'occupied';
  current_order_id?: string;
  tenant_id: string;
}

export default function TablesPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newNumber, setNewNumber] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    async function fetch() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("tables")
          .select("*")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("number");
        setTables(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [tenantId]);

  const handleCreate = async () => {
    if (!tenantId) return;
    setCreating(true);
    try {
      const { data } = await supabase
        .from("tables")
        .insert({ number: newNumber, tenant_id: tenantId, status: "free" })
        .select()
        .single();
      if (data) setTables([...tables, data]);
      setShowCreate(false);
      setNewNumber(tables.length + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: "free" | "occupied") => {
    await supabase.from("tables").update({ status }).eq("id", id);
    setTables(tables.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("tables").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    setTables(tables.filter((t) => t.id !== id));
  };

  const freeTables = tables.filter((t) => t.status === "free");
  const occupiedTables = tables.filter((t) => t.status === "occupied");

  if (tenantLoading || loading) {
    return <div style={s.page}><h1 style={s.title}>Mesas</h1><p style={s.loading}>Cargando...</p></div>;
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Mesas</h1>
        <button onClick={() => setShowCreate(true)} style={s.addBtn}>+ Agregar Mesa</button>
      </div>

      <div style={s.stats}>
        <div style={s.statCard}>
          <span style={s.statLabel}>Libres</span>
          <span style={{ ...s.statValue, color: "var(--success-color)" }}>{freeTables.length}</span>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Ocupadas</span>
          <span style={{ ...s.statValue, color: "var(--error-color)" }}>{occupiedTables.length}</span>
        </div>
        <div style={s.statCard}>
          <span style={s.statLabel}>Total</span>
          <span style={s.statValue}>{tables.length}</span>
        </div>
      </div>

      {tables.length === 0 ? (
        <p style={s.empty}>No hay mesas. Agrega la primera mesa para comenzar.</p>
      ) : (
        <div style={s.grid}>
          {tables.map((table) => (
            <div
              key={table.id}
              style={{
                ...s.tableCard,
                borderColor: table.status === "free" ? "var(--success-border)" : "var(--error-border)",
              }}
            >
              <div style={s.tableNumber}>{table.number}</div>
              <div
                style={{
                  ...s.tableStatus,
                  backgroundColor: table.status === "free" ? "var(--success-bg)" : "var(--error-bg)",
                  color: table.status === "free" ? "var(--success-color)" : "var(--error-color)",
                }}
              >
                {table.status === "free" ? "Libre" : "Ocupada"}
              </div>
              <div style={s.tableActions}>
                <button
                  onClick={() => handleStatusChange(table.id, table.status === "free" ? "occupied" : "free")}
                  style={s.toggleBtn}
                >
                  {table.status === "free" ? "Ocupar" : "Liberar"}
                </button>
                <button onClick={() => handleDelete(table.id)} style={s.deleteBtn}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div style={s.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Agregar Mesa</h3>
            <label style={s.label}>Número de mesa:</label>
            <input
              type="number"
              value={newNumber}
              onChange={(e) => setNewNumber(Number(e.target.value))}
              style={s.input}
              min={1}
            />
            <div style={s.modalButtons}>
              <button onClick={() => setShowCreate(false)} style={s.cancelBtn}>Cancelar</button>
              <button onClick={handleCreate} disabled={creating} style={s.confirmBtn}>
                {creating ? "Agregando..." : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { width: "100%", maxWidth: 900, padding: "0 32px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 },
  addBtn: { padding: "8px 16px", borderRadius: 6, border: "none", backgroundColor: "var(--accent-color)", color: "#0f0f0f", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  loading: { color: "var(--text-muted)", textAlign: "center", padding: 40 },
  empty: { color: "var(--text-muted)", textAlign: "center", padding: 40, fontSize: 14 },
  stats: { display: "flex", gap: 16, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "16px 20px", display: "flex", flexDirection: "column", alignItems: "center" },
  statLabel: { fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" },
  statValue: { fontSize: 28, fontWeight: 700, color: "var(--text-primary)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 },
  tableCard: { backgroundColor: "var(--bg-surface)", border: "2px solid", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  tableNumber: { fontSize: 32, fontWeight: 700, color: "var(--text-primary)" },
  tableStatus: { padding: "4px 12px", borderRadius: 4, fontSize: 11, fontWeight: 600 },
  tableActions: { display: "flex", gap: 8 },
  toggleBtn: { padding: "4px 12px", borderRadius: 4, border: "1px solid var(--border-color)", backgroundColor: "transparent", color: "var(--text-primary)", fontSize: 11, fontWeight: 600, cursor: "pointer" },
  deleteBtn: { padding: "4px 8px", borderRadius: 4, border: "none", backgroundColor: "transparent", color: "var(--error-color)", fontSize: 16, fontWeight: 700, cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 10, padding: 24, width: "90%", maxWidth: 360 },
  modalTitle: { margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" },
  label: { fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 },
  input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", fontSize: 14, marginBottom: 16 },
  modalButtons: { display: "flex", gap: 10 },
  cancelBtn: { flex: 1, padding: "10px", backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
  confirmBtn: { flex: 1, padding: "10px", backgroundColor: "var(--accent-color)", color: "#0f0f0f", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
};