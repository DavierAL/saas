import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type { User, UserRole } from "@saas-pos/domain";
import { Modal } from "@saas-pos/ui";

type UserFormData = {
  email: string;
  password: string;
  role: UserRole;
};

type UserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  onUpdateRole: (userId: string, role: UserRole) => Promise<void>;
  editingUser: User | null;
  submitting: boolean;
};

export function UserModal({ isOpen, onClose, onSubmit, onUpdateRole, editingUser, submitting }: UserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({ email: "", password: "", role: "cashier" });
  const [currentRole, setCurrentRole] = useState<UserRole>("cashier");
  const [isEditingRole, setIsEditingRole] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormData({ email: editingUser.email, password: "", role: editingUser.role });
      setCurrentRole(editingUser.role);
      setIsEditingRole(true);
    } else {
      setFormData({ email: "", password: "", role: "cashier" });
      setIsEditingRole(false);
    }
  }, [editingUser, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingRole && editingUser) {
      await onUpdateRole(editingUser.id, currentRole);
    } else {
      await onSubmit(formData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingUser ? "Editar Usuario" : "Agregar Usuario"}>
      <form onSubmit={handleSubmit}>
        {!isEditingRole ? (
          <>
            <div style={s.formGroup}>
              <label style={s.label}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={s.input}
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Contraseña temporal</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                style={s.input}
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Rol</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                style={s.input}
              >
                <option value="admin">Administrador</option>
                <option value="cashier">Cajero</option>
                <option value="waiter">Mesero</option>
                <option value="barber">Barbero</option>
              </select>
            </div>
          </>
        ) : (
          <div style={s.formGroup}>
            <label style={s.label}>Rol</label>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              style={s.input}
            >
              <option value="admin">Administrador</option>
              <option value="cashier">Cajero</option>
              <option value="waiter">Mesero</option>
              <option value="barber">Barbero</option>
            </select>
          </div>
        )}

        <div style={s.buttonRow}>
          <button type="button" onClick={onClose} style={s.cancelBtn}>Cancelar</button>
          <button type="submit" disabled={submitting} style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const s: Record<string, CSSProperties> = {
  formGroup: { marginBottom: "1rem" },
  label: { display: "block", marginBottom: "0.5rem", fontSize: 14 },
  input: {
    width: "100%",
    padding: "0.5rem",
    backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    fontSize: 14,
  },
  buttonRow: { display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1.5rem" },
  cancelBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "var(--accent-color)",
    color: "#0f0f0f",
    border: "none",
    borderRadius: "4px",
    fontWeight: 600,
    cursor: "pointer",
  },
};