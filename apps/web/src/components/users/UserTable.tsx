import type { CSSProperties } from "react";
import type { User, UserRole } from "@saas-pos/domain";

type UserTableProps = {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  cashier: "Cajero",
  waiter: "Mesero",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#3ECF8E",
  cashier: "#8B5CF6",
  waiter: "#F59E0B",
};

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div style={s.emptyState}>
        <p style={{ color: "#555" }}>No hay usuarios</p>
      </div>
    );
  }

  return (
    <div style={s.tableWrap}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Email</th>
            <th style={s.th}>Rol</th>
            <th style={{ ...s.th, textAlign: "right" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={s.tr}>
              <td style={s.td}>{user.email}</td>
              <td style={s.td}>
                <span
                  style={{
                    display: "inline-flex",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: `${ROLE_COLORS[user.role]}20`,
                    color: ROLE_COLORS[user.role],
                  }}
                >
                  {ROLE_LABELS[user.role]}
                </span>
              </td>
              <td style={{ ...s.td, textAlign: "right" }}>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button style={s.ghostBtn} onClick={() => onEdit(user)}>Editar</button>
                  <button style={{ ...s.ghostBtn, color: "var(--error-color)" }} onClick={() => onDelete(user.id)}>
                    Desactivar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  tableWrap: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: 8,
    border: "1px solid var(--border-color)",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "10px 16px",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textAlign: "left",
    borderBottom: "1px solid var(--border-color)",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },
  tr: { transition: "background 0.1s" },
  td: {
    padding: "12px 16px",
    fontSize: 13,
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-light)",
  },
  ghostBtn: {
    background: "none",
    border: "1px solid var(--border-color)",
    borderRadius: 4,
    padding: "4px 10px",
    fontSize: 11,
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    backgroundColor: "var(--bg-surface)",
    borderRadius: 8,
    border: "1px solid var(--border-color)",
  },
};