import { useState, useEffect } from "react";
import { useTenantId } from "../hooks/useTenantId";
import { supabase } from "../lib/supabase";

interface Appointment {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  item_id: string;
  item_name?: string;
  barber_id?: string;
  barber_name?: string;
  duration_minutes: number;
  start_time: string;
  status: 'scheduled' | 'done' | 'cancelled';
  notes?: string;
  tenant_id: string;
  created_at: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8am - 8pm

export default function AppointmentsPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [items, setItems] = useState<{id: string, name: string, duration_minutes?: number}[]>([]);
  const [barbers, setBarbers] = useState<{id: string, name: string}[]>([]);
  const [customers, setCustomers] = useState<{id: string, name: string, phone?: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]!);
  const [showCreate, setShowCreate] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    item_id: "",
    barber_id: "",
    start_time: "",
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
          .select("*, item:items(name), barber:users!barber_id(name), customer:customers(name)")
          .gte("start_time", start)
          .lte("start_time", end)
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("start_time");

        const { data: itemsData } = await supabase
          .from("items")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .eq("type", "service")
          .is("deleted_at", null);

        const { data: usersData } = await supabase
          .from("users")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .eq("role", "barber")
          .is("deleted_at", null);

        const { data: customersData } = await supabase
          .from("customers")
          .select("id, name, phone")
          .eq("tenant_id", tenantId)
          .is("deleted_at", null)
          .order("name");

        const apptsWithBarber = (appts || []).map((a: any) => ({
          ...a,
          barber_name: a.barber?.name || null,
        }));

        setAppointments(apptsWithBarber);
        setItems(itemsData || []);
        setBarbers(usersData || []);
        setCustomers(customersData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [tenantId, selectedDate]);

  const hasOverlap = (barberId: string, startTime: string, duration: number) => {
    const newStart = new Date(`${selectedDate}T${startTime}:00`).getTime();
    const newEnd = newStart + duration * 60 * 1000;
    return appointments.some((a) => {
      if (a.barber_id !== barberId || a.status === "cancelled") return false;
      const existStart = new Date(a.start_time).getTime();
      const existEnd = existStart + (a.duration_minutes || 30) * 60 * 1000;
      return newStart < existEnd && newEnd > existStart;
    });
  };

  const handleCreate = async () => {
    if (!tenantId || !newAppointment.customer_name || !newAppointment.item_id || !newAppointment.start_time) return;
    if (newAppointment.barber_id && hasOverlap(newAppointment.barber_id, newAppointment.start_time, newAppointment.duration_minutes)) {
      alert("El barbero ya tiene una cita en ese horario. Elige otro horario o barbero.");
      return;
    }
    try {
      const { data } = await supabase
        .from("appointments")
        .insert({
          customer_id: newAppointment.customer_id || null,
          customer_name: newAppointment.customer_name,
          customer_phone: newAppointment.customer_phone || null,
          item_id: newAppointment.item_id,
          barber_id: newAppointment.barber_id || null,
          start_time: `${selectedDate}T${newAppointment.start_time}:00`,
          duration_minutes: newAppointment.duration_minutes,
          notes: newAppointment.notes || null,
          status: "scheduled",
          tenant_id: tenantId,
        })
        .select()
        .single();
      if (data) setAppointments([...appointments, data]);
      setShowCreate(false);
      setNewAppointment({ customer_id: "", customer_name: "", customer_phone: "", item_id: "", barber_id: "", start_time: "", duration_minutes: 30, notes: "" });
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
      const hourOnly = new Date(a.start_time).getHours();
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
                    borderTopColor:
                      appt.status === "done"
                        ? "var(--success-color)"
                        : appt.status === "cancelled"
                        ? "var(--text-muted)"
                        : "var(--accent-color)",
                    borderTopWidth: 2,
                  }}
                >
                  <div style={s.apptClient}>
                    {appt.customer_id && <span style={s.registeredBadge} title="Cliente registrado">👤</span>}
                    {appt.customer_name}
                  </div>
                  <div style={s.apptService}>{(appt as any).item?.name || "Servicio"}</div>
                  {appt.barber_name && <div style={s.apptBarber}>✂️ {appt.barber_name}</div>}
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
            <label style={s.label}>Cliente registrado:</label>
            <select
              value={newAppointment.customer_id}
              onChange={(e) => {
                const customer = customers.find(c => c.id === e.target.value);
                setNewAppointment({
                  ...newAppointment,
                  customer_id: e.target.value,
                  customer_name: customer?.name || "",
                  customer_phone: customer?.phone || "",
                });
              }}
              style={s.select}
            >
              <option value="">Nuevo cliente / Walk-in</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
            <label style={s.label}>Nombre:</label>
            <input
              value={newAppointment.customer_name}
              onChange={(e) => setNewAppointment({ ...newAppointment, customer_name: e.target.value })}
              style={s.input}
              placeholder="Nombre del cliente"
            />
            <label style={s.label}>Teléfono:</label>
            <input
              value={newAppointment.customer_phone}
              onChange={(e) => setNewAppointment({ ...newAppointment, customer_phone: e.target.value })}
              style={s.input}
              placeholder="+51..."
            />
            <label style={s.label}>Barbero:</label>
            <select
              value={newAppointment.barber_id}
              onChange={(e) => setNewAppointment({ ...newAppointment, barber_id: e.target.value })}
              style={s.select}
            >
              <option value="">Seleccionar barbero</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>{barber.name}</option>
              ))}
            </select>
            <label style={s.label}>Servicio:</label>
            <select
              value={newAppointment.item_id}
              onChange={(e) => {
                const item = items.find(i => i.id === e.target.value);
                setNewAppointment({
                  ...newAppointment,
                  item_id: e.target.value,
                  duration_minutes: item?.duration_minutes || 30,
                });
              }}
              style={s.select}
            >
              <option value="">Seleccionar servicio</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <label style={s.label}>Duración (min):</label>
            <input
              type="number"
              min="5"
              step="5"
              value={newAppointment.duration_minutes}
              onChange={(e) => setNewAppointment({ ...newAppointment, duration_minutes: parseInt(e.target.value, 10) || 30 })}
              style={s.input}
            />
            <label style={s.label}>Hora:</label>
            <select
              value={newAppointment.start_time}
              onChange={(e) => setNewAppointment({ ...newAppointment, start_time: e.target.value })}
              style={s.select}
            >
              <option value="">Seleccionar hora</option>
              {HOURS.map((h) => (
                <option key={h} value={h.toString().padStart(2, '0')}>{h}:00</option>
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
  appointmentCard: { padding: "8px 12px", borderRadius: 4, width: "100%" },
  apptClient: { fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 4 },
  apptService: { fontSize: 11, color: "var(--text-secondary)", marginTop: 2 },
  apptBarber: { fontSize: 10, color: "var(--text-muted)", marginTop: 2 },
  apptActions: { display: "flex", gap: 4, marginTop: 4 },
  actionBtn: { padding: "2px 6px", borderRadius: 2, border: "none", backgroundColor: "transparent", color: "var(--text-secondary)", fontSize: 10, cursor: "pointer" },
  registeredBadge: { fontSize: 12 },
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