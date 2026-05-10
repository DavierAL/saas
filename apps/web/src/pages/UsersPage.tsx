import { useState } from "react";
import type { CSSProperties } from "react";
import type { User, UserRole } from "@saas-pos/domain";

import { useTenantId } from "../hooks/useTenantId";
import { useUsers } from "../hooks/useUsers";
import { UserTable, UserModal } from "../components/users";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function UsersPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const { users, loading, error, submitting, createUser, updateUserRole, deleteUser, clearError } = useUsers(
    tenantId ?? null
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  const handleCreate = async (formData: { email: string; password: string; role: UserRole }) => {
    await createUser(formData);
    setIsModalOpen(false);
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    await updateUserRole(userId, role);
    setEditingUser(null);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Estás seguro de desactivar este usuario?")) return;
    await deleteUser(userId);
  };

  if (tenantLoading || (loading && !users.length)) {
    return (
      <div style={styles.loading}>
        <h2 style={{ color: "var(--accent-color)" }}>Cargando...</h2>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div style={styles.page}>
        {error && (
          <div style={styles.errorBanner}>
            {error}
            <button onClick={clearError} style={styles.errorBtn}>Dismiss</button>
          </div>
        )}

        <div style={styles.header}>
          <h1 style={styles.title}>👥 Usuarios</h1>
          <button style={styles.addBtn} onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
            + Agregar Usuario
          </button>
        </div>

        <div style={styles.filterRow}>
          <label style={{ marginRight: "0.5rem" }}>Filtrar por rol:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
            style={styles.select}
          >
            <option value="all">Todos</option>
            <option value="admin">Administrador</option>
            <option value="cashier">Cajero</option>
            <option value="waiter">Mesero</option>
          </select>
        </div>

        <UserTable users={users} onEdit={setEditingUser} onDelete={handleDelete} />

        <UserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreate}
          onUpdateRole={handleUpdateRole}
          editingUser={null}
          submitting={submitting}
        />

        <UserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleCreate}
          onUpdateRole={handleUpdateRole}
          editingUser={editingUser}
          submitting={submitting}
        />
      </div>
    </ErrorBoundary>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)",
    padding: "2rem",
    minHeight: "100vh",
  },
  loading: {
    backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)",
    padding: "2rem",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  title: {
    marginTop: 0,
    fontSize: "var(--font-size-6xl)",
    fontWeight: "var(--font-weight-bold)",
  },
  addBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "var(--accent-color)",
    color: "#0f0f0f",
    border: "none",
    borderRadius: "4px",
    fontWeight: 600,
    cursor: "pointer",
  },
  filterRow: { marginBottom: "1rem" },
  select: {
    padding: "0.5rem",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
  },
  errorBanner: {
    padding: "1rem",
    backgroundColor: "#7F1D1D",
    border: "1px solid #EF4444",
    borderRadius: "4px",
    marginBottom: "1rem",
    color: "#FCA5A5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorBtn: {
    background: "none",
    border: "none",
    color: "#FCA5A5",
    cursor: "pointer",
    textDecoration: "underline",
  },
};