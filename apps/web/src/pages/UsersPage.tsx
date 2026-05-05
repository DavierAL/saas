import { useState, useEffect } from "react";
import type { User, UserRole } from "@saas-pos/domain";
import { useCases } from "../lib/use-cases";
import { supabase } from "../lib/supabase";
import { useTenantId } from "../hooks/useTenantId";
import { ErrorBoundary } from "../components/ErrorBoundary";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: " Administrador",
  cashier: "Cajero",
  waiter: "Mesero",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#3ECF8E",
  cashier: "#8B5CF6",
  waiter: "#F59E0B",
};

export default function UsersPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("cashier");
  const [submitting, setSubmitting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  useEffect(() => {
    if (!tenantId) return;
    loadUsers();
  }, [tenantId, roleFilter]);

  const loadUsers = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const allUsers = await useCases.users.findAll(tenantId);
      if (roleFilter !== "all") {
        setUsers(allUsers.filter((u) => u.role === roleFilter));
      } else {
        setUsers(allUsers);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSubmitting(true);
    try {
      await useCases.users.createUser(
        { email: newEmail, password: newPassword, role: newRole },
        tenantId,
        {
          hashPassword: async (pwd: string) => {
            const { data, error } = await supabase.auth.admin.generateLink({
              type: "signup",
              email: newEmail,
              password: pwd
            });
            if (error) throw error;
            return data.properties?.hashed_token || "stub";
          },
        }
      );
      setNewEmail("");
      setNewPassword("");
      setNewRole("cashier");
      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Error al crear usuario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingUser || !tenantId) return;
    setSubmitting(true);
    try {
      await useCases.users.updateUserRole(
        editingUser.id,
        { role: currentUserRole as UserRole },
        tenantId
      );
      setEditingUser(null);
      setCurrentUserRole("");
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Error al actualizar rol");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!tenantId) return;
    if (!confirm("¿Estás seguro de desactivar este usuario?")) return;
    setSubmitting(true);
    try {
      await useCases.users.deleteUser(userId, tenantId);
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Error al desactivar usuario");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setCurrentUserRole(user.role);
  };

  if (tenantLoading || (loading && !users.length)) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--text-primary)",
          padding: "2rem",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2 style={{ color: "var(--accent-color)" }}>Cargando...</h2>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--text-primary)",
          padding: "2rem",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              fontSize: "var(--font-size-6xl)",
              fontWeight: "var(--font-weight-bold)",
            }}
          >
            👥 Usuarios
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "var(--accent-color)",
              color: "#0f0f0f",
              border: "none",
              borderRadius: "4px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Agregar Usuario
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#7F1D1D",
              border: "1px solid #EF4444",
              borderRadius: "4px",
              marginBottom: "1rem",
              color: "#FCA5A5",
            }}
          >
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: "1rem",
                background: "none",
                border: "none",
                color: "#FCA5A5",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: "0.5rem" }}>Filtrar por rol:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
            style={{
              padding: "0.5rem",
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
            }}
          >
            <option value="all">Todos</option>
            <option value="admin">Administrador</option>
            <option value="cashier">Cajero</option>
            <option value="waiter">Mesero</option>
          </select>
        </div>

        {/* Users Table */}
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            overflow: "hidden",
          }}
        >
          {users.length === 0 ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              No hay usuarios registrados.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-surface)",
                  }}
                >
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Rol
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Creado
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "right",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <td style={{ padding: "1rem" }}>{user.email}</td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "12px",
                          backgroundColor: `${ROLE_COLORS[user.role]}20`,
                          color: ROLE_COLORS[user.role],
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                      {new Date(user.created_at).toLocaleDateString("es-PE")}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <button
                        onClick={() => openEditModal(user)}
                        style={{
                          marginRight: "0.5rem",
                          padding: "0.25rem 0.75rem",
                          backgroundColor: "transparent",
                          color: "var(--accent-color)",
                          border: "1px solid var(--accent-color)",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        style={{
                          padding: "0.25rem 0.75rem",
                          backgroundColor: "transparent",
                          color: "#EF4444",
                          border: "1px solid #EF4444",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Modal */}
        {isModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                padding: "2rem",
                borderRadius: "8px",
                width: "400px",
                maxWidth: "90%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0 }}>Agregar Usuario</h2>
              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "14px",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      backgroundColor: "var(--bg-base)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "14px",
                    }}
                  >
                    Contraseña temporal
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      backgroundColor: "var(--bg-base)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "14px",
                    }}
                  >
                    Rol
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      backgroundColor: "var(--bg-base)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "4px",
                    }}
                  >
                    <option value="admin">Administrador</option>
                    <option value="cashier">Cajero</option>
                    <option value="waiter">Mesero</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "transparent",
                      color: "var(--text-primary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "var(--accent-color)",
                      color: "#0f0f0f",
                      border: "none",
                      borderRadius: "4px",
                      fontWeight: 600,
                      cursor: "pointer",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "Creando..." : "Crear Usuario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingUser && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setEditingUser(null)}
          >
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                padding: "2rem",
                borderRadius: "8px",
                width: "400px",
                maxWidth: "90%",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0 }}>Editar Rol</h2>
              <p style={{ marginBottom: "1rem" }}>
                Usuario: <strong>{editingUser.email}</strong>
              </p>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "14px",
                  }}
                >
                  Rol
                </label>
                <select
                  value={currentUserRole}
                  onChange={(e) => setCurrentUserRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    backgroundColor: "var(--bg-base)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                  }}
                >
                  <option value="admin">Administrador</option>
                  <option value="cashier">Cajero</option>
                  <option value="waiter">Mesero</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={submitting}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "var(--accent-color)",
                    color: "#0f0f0f",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}