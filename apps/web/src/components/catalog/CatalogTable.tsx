import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import type { Item } from "@saas-pos/domain";
import { formatMoney, createMoney } from "@saas-pos/domain";
import { TypeBadge } from "./TypeBadge";
import { StockIndicator } from "./StockIndicator";

type SortField = "name" | "price" | "stock" | "type";
type SortDir = "asc" | "desc";

type CatalogTableProps = {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
};

export function CatalogTable({ items, onEdit, onDelete }: CatalogTableProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "name",
    dir: "asc",
  });

  const filtered = useMemo(() => {
    return items
      .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let cmp = 0;
        if (sort.field === "name") cmp = a.name.localeCompare(b.name);
        if (sort.field === "price") cmp = a.price - b.price;
        if (sort.field === "stock") cmp = (a.stock ?? -1) - (b.stock ?? -1);
        if (sort.field === "type") cmp = a.type.localeCompare(b.type);
        return sort.dir === "asc" ? cmp : -cmp;
      });
  }, [items, search, sort]);

  const toggleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" }
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span
      style={{
        marginLeft: 4,
        color: sort.field === field ? "var(--accent-color)" : "var(--text-muted)",
        fontSize: 10,
      }}
    >
      {sort.field === field ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <>
      <div style={s.toolbar}>
        <div style={s.searchBox}>
          <span style={s.searchIcon}>⌕</span>
          <input
            style={s.searchInput}
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={s.resultCount}>{filtered.length} resultados</span>
      </div>

      {filtered.length === 0 ? (
        <div style={s.emptyState}>
          <p style={{ color: "#555", fontSize: 14 }}>
            No se encontraron items para "{search}"
          </p>
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 300, cursor: "pointer" }} onClick={() => toggleSort("name")}>
                  Nombre <SortIcon field="name" />
                </th>
                <th style={{ ...s.th, cursor: "pointer" }} onClick={() => toggleSort("type")}>
                  Tipo <SortIcon field="type" />
                </th>
                <th style={{ ...s.th, textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("price")}>
                  Precio <SortIcon field="price" />
                </th>
                <th style={{ ...s.th, textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("stock")}>
                  Stock <SortIcon field="stock" />
                </th>
                <th style={{ ...s.th, textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  style={s.tr}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent")
                  }
                >
                  <td style={s.td}>
                    <span style={{ color: "#ededed", fontSize: 14, fontWeight: 500 }}>
                      {item.name}
                    </span>
                  </td>
                  <td style={s.td}>
                    <TypeBadge type={item.type} />
                  </td>
                  <td style={{ ...s.td, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#3ECF8E", fontWeight: 700, fontSize: 14 }}>
                    {formatMoney(createMoney(item.price, "PEN"))}
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    <StockIndicator stock={item.stock} />
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button style={s.ghostBtn} onClick={() => onEdit(item)}>Editar</button>
                      <button style={{ ...s.ghostBtn, color: "var(--error-color)" }} onClick={() => onDelete(item)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const s: Record<string, CSSProperties> = {
  toolbar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  searchBox: {
    display: "flex",
    alignItems: "center",
    flex: 1,
    maxWidth: 360,
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: 6,
    padding: "0 12px",
  },
  searchIcon: { color: "var(--text-muted)", fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 36,
    background: "none",
    border: "none",
    outline: "none",
    color: "var(--text-primary)",
    fontSize: 13,
  },
  resultCount: { fontSize: 12, color: "var(--text-muted)" },
  emptyState: { textAlign: "center", padding: "48px 0" },
  tableWrap: {
    backgroundColor: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: 8,
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "10px 16px",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textAlign: "left" as const,
    borderBottom: "1px solid var(--border-color)",
    letterSpacing: "0.4px",
    textTransform: "uppercase" as const,
    userSelect: "none" as const,
  },
  tr: { transition: "background 0.1s", cursor: "default" },
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
};