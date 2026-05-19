import { useState, useEffect } from "react";
import { useTenantId } from "../hooks/useTenantId";
import { supabase } from "../lib/supabase";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

export function CustomersPage() {
  const { tenantId } = useTenantId();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  useEffect(() => {
    if (!tenantId) return;
    fetchCustomers();
  }, [tenantId]);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!tenantId || !form.name.trim()) return;

    if (editingCustomer) {
      await supabase
        .from("customers")
        .update({ name: form.name, phone: form.phone || null, email: form.email || null, notes: form.notes || null })
        .eq("id", editingCustomer.id);
    } else {
      await supabase
        .from("customers")
        .insert({ tenant_id: tenantId, name: form.name, phone: form.phone || null, email: form.email || null, notes: form.notes || null });
    }

    setShowModal(false);
    setEditingCustomer(null);
    setForm({ name: "", phone: "", email: "", notes: "" });
    fetchCustomers();
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({ name: customer.name, phone: customer.phone || "", email: customer.email || "", notes: customer.notes || "" });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar cliente?")) return;
    await supabase.from("customers").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    fetchCustomers();
  };

  return (
    <div className="page-wrapper" style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Clientes</h1>
          <p style={s.subtitle}>{customers.length} clientes registrados</p>
        </div>
        <button style={s.addButton} onClick={() => { setShowModal(true); setEditingCustomer(null); setForm({ name: "", phone: "", email: "", notes: "" }); }}>
          + Nuevo Cliente
        </button>
      </div>

      {loading ? (
        <div style={s.loading}>Cargando...</div>
      ) : customers.length === 0 ? (
        <div style={s.empty}>
          <p>No hay clientes registrados</p>
          <p style={s.emptySub}>Agrega clientes para gestionar tu negocio</p>
        </div>
      ) : (
        <div style={s.grid}>
          {customers.map((customer, i) => (
            <div key={customer.id} style={{ ...s.card, animationDelay: `${i * 50}ms` }} className="fade-in">
              <div style={s.cardHeader}>
                <div style={s.avatar}>{customer.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h3 style={s.cardName}>{customer.name}</h3>
                  <p style={s.cardDate}>Desde {new Date(customer.created_at).toLocaleDateString("es-PE")}</p>
                </div>
              </div>
              <div style={s.cardInfo}>
                {customer.phone && <p>{customer.phone}</p>}
                {customer.email && <p>{customer.email}</p>}
                {customer.notes && <p style={s.notes}>{customer.notes}</p>}
              </div>
              <div style={s.cardActions}>
                <button style={s.editBtn} onClick={() => handleEdit(customer)}>Editar</button>
                <button style={s.deleteBtn} onClick={() => handleDelete(customer.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={s.modalBack} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}</h2>
            <div style={s.formGroup}>
              <label style={s.label}>Nombre *</label>
              <input style={s.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del cliente" />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Teléfono</label>
              <input style={s.input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="999-999-999" />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Email</label>
              <input style={s.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Notas</label>
              <textarea style={s.textarea} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas sobre el cliente" rows={3} />
            </div>
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
              <button style={s.saveBtn} onClick={handleSubmit}>{editingCustomer ? "Guardar" : "Crear"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: 24 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0 },
  subtitle: { fontSize: 14, color: "var(--text-muted)", margin: "4px 0 0" },
  addButton: { backgroundColor: "#3ECF8E", color: "#000", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" },
  loading: { textAlign: "center", padding: 40, color: "var(--text-muted)" },
  empty: { textAlign: "center", padding: 60, color: "var(--text-muted)" },
  emptySub: { fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },
  card: { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16 },
  cardHeader: { display: "flex", gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: "50%", backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--text-primary)" },
  cardName: { fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0 },
  cardDate: { fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" },
  cardInfo: { marginBottom: 12 },
  notes: { fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" },
  cardActions: { display: "flex", gap: 8 },
  editBtn: { flex: 1, padding: "8px 12px", backgroundColor: "var(--bg-hover)", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  deleteBtn: { flex: 1, padding: "8px 12px", backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  modalBack: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { backgroundColor: "var(--bg-surface)", borderRadius: 16, padding: 24, width: "90%", maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 20px" },
  formGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 14 },
  textarea: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 14, resize: "vertical" },
  modalActions: { display: "flex", gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: "12px", backgroundColor: "var(--bg-hover)", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  saveBtn: { flex: 1, padding: "12px", backgroundColor: "#3ECF8E", color: "#000", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
};