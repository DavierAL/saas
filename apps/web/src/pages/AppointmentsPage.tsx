import { useState, useEffect } from "react";
import { useTenantId } from "../hooks/useTenantId";
import { supabase } from "../lib/supabase";

interface Appointment {
  id: string;
  client_name: string;
  client_phone?: string;
  item_id: string;
  item_name?: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'done' | 'cancelled';
  notes?: string;
  tenant_id: string;
  created_at: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8am - 8pm

export default function AppointmentsPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [items, setItems] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]!);
  const [showCreate, setShowCreate] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    client_name: "",
    client_phone: "",
    item_id: "",
    scheduled_at: "",
    duration_minutes: 30,
    notes: "",
  });

  useEffect(() => {
    if (!tenantId) return;
    async function fetch() {
      setLoading(true);
      try {
        const start = `${selectedDate}T00:00:00`;
        const end = `${selectedDate}T23:59:59`;
        const { data: appts } = await supabase
          .from("appointments")
          .select("*, item:items(name)")
          .gte("scheduled_at", start)
          .lte("scheduled_at", end)
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("scheduled_at");

        const { data: itemsData } = await supabase
          .from("items")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .eq("type", "service")
          .is("deleted_at", null);

        setAppointments(appts || []);
        setItems(itemsData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [tenantId, selectedDate]);

  const handleCreate = async () => {
    if (!tenantId || !newAppointment.client_name || !newAppointment.item_id || !newAppointment.scheduled_at) return;
    try {
      const { data } = await supabase
        .from("appointments")
        .insert({
          client_name: newAppointment.client_name,
          client_phone: newAppointment.client_phone || null,
          item_id: newAppointment.item_id,
          scheduled_at: `${selectedDate}T${newAppointment.scheduled_at}:00`,
          duration_minutes: newAppointment.duration_minutes,
          notes: newAppointment.notes || null,
          status: "scheduled",
          tenant_id: tenantId,
        })
        .select()
        .single();
      if (data) setAppointments([...appointments, data]);
      setShowCreate(false);
      setNewAppointment({ client_name: "", client_phone: "", item_id: "", scheduled_at: "", duration_minutes: 30, notes: "" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (id: string, status: "scheduled" | "done" | "cancelled") => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    setAppointments(appointments.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const getAppointmentsForHour = (hour: number) => {
    return appointments.filter((a) => {
      const hourOnly = new Date(a.scheduled_at).getHours();
      return hourOnly === hour;
    });
  };

  if (tenantLoading || loading) {
    return <div style={s.page}><h1 style={s.title}>Citas</h1><p style={s.loading}>Cargando...</p></div>;
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Citas</h1>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={s.dateInput} />
        <button onClick={() => setShowCreate(true)} style={s.addBtn}>+ Nueva Cita</button>
      </div>

      <div style={s.grid}>
        {HOURS.map((hour) => (
          <div key={hour} style={s.hourRow}>
            <div style={s.hourLabel}>{hour}:00</div>
            <div style={s.hourSlots}>
              {getAppointmentsForHour(hour).map((appt) => (
                <div
                  key={appt.id}
                  style={{
                    ...s.appointmentCard,
                    backgroundColor:
                      appt.status === "done"
                        ? "var(--success-bg)"
                        : appt.status === "cancelled"
                        ? "var(--bg-elevated)"
                        : "var(--accent-bg)",
                    borderLeftColor:
                      appt.status === "done"
                        ? "var(--success-color)"
                        : appt.status === "cancelled"
                        ? "var(--text-muted)"
                        : "var(--accent-color)",
                  }}
                >
                  <div style={s.apptClient}>{appt.client_name}</div>
                  <div style={s.apptService}>{(appt as any).item?.name || "Servicio"}</div>
                  <div style={s.apptActions}>
                    <button onClick={() => handleStatusChange(appt.id, "done")} style={s.actionBtn}>✓</button>
                    <button onClick={() => handleStatusChange(appt.id, "cancelled")} style={s.actionBtn}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div style={s.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Nueva Cita</h3>
            <label style={s.label}>Cliente:</label>
            <input
              value={newAppointment.client_name}
              onChange={(e) => setNewAppointment({ ...newAppointment, client_name: e.target.value })}
              style={s.input}
              placeholder="Nombre del cliente"
            />
            <label style={s.label}>Teléfono:</label>
            <input
              value={newAppointment.client_phone}
              onChange={(e) => setNewAppointment({ ...newAppointment, client_phone: e.target.value })}
              style={s.input}
              placeholder="+51..."
            />
            <label style={s.label}>Servicio:</label>
            <select
              value={newAppointment.item_id}
              onChange={(e) => setNewAppointment({ ...newAppointment, item_id: e.target.value })}
              style={s.select}
            >
              <option value="">Seleccionar servicio</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <label style={s.label}>Hora:</label>
            <select
              value={newAppointment.scheduled_at}
              onChange={(e) => setNewAppointment({ ...newAppointment, scheduled_at: e.target.value })}
              style={s.select}
            >
              <option value="">Seleccionar hora</option>
              {HOURS.map((h) => (
                <option key={h} value={h.toString()}>{h}:00</option>
              ))}
            </select>
            <div style={s.modalButtons}>
              <button onClick={() => setShowCreate(false)} style={s.cancelBtn}>Cancelar</button>
              <button onClick={handleCreate} style={s.confirmBtn}>
                Crear Cita
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
  dateInput: { padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", fontSize: 14 },
  addBtn: { padding: "8px 16px", borderRadius: 6, border: "none", backgroundColor: "var(--accent-color)", color: "#0f0f0f", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  loading: { color: "var(--text-muted)", textAlign: "center", padding: 40 },
  grid: { display: "flex", flexDirection: "column", gap: 8 },
  hourRow: { display: "flex", gap: 12, minHeight: 60 },
  hourLabel: { width: 60, fontSize: 12, fontWeight: 600, color: "var(--text-muted)", paddingTop: 8 },
  hourSlots: { flex: 1, display: "flex", gap: 8, flexWrap: "wrap", backgroundColor: "var(--bg-surface)", borderRadius: 6, padding: 8, minHeight: 50 },
  appointmentCard: { padding: "8px 12px", borderRadius: 4, borderLeft: "3px solid", width: "100%" },
  apptClient: { fontSize: 13, fontWeight: 600, color: "var(--text-primary)" },
  apptService: { fontSize: 11, color: "var(--text-secondary)", marginTop: 2 },
  apptActions: { display: "flex", gap: 4, marginTop: 4 },
  actionBtn: { padding: "2px 6px", borderRadius: 2, border: "none", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 10, cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 10, padding: 24, width: "90%", maxWidth: 360 },
  modalTitle: { margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" },
  label: { fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 },
  input: { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", fontSize: 14, marginBottom: 12 },
  select: { width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-color)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", fontSize: 14, marginBottom: 12 },
  modalButtons: { display: "flex", gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, padding: "10px", backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
  confirmBtn: { flex: 1, padding: "10px", backgroundColor: "var(--accent-color)", color: "#0f0f0f", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" },
};