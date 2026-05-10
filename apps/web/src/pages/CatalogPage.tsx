import { useState, useEffect } from "react";
import type { Item, ItemType } from "@saas-pos/domain";
import { formatMoney, createMoney } from "@saas-pos/domain";

import { useCases } from "../lib/use-cases";
import { useTenantId } from "../hooks/useTenantId";

type SortField = "name" | "price" | "stock" | "type";
type SortDir = "asc" | "desc";

type ItemFormData = {
  name: string;
  type: ItemType;
  price: string;
  stock: string;
};

function TypeBadge({ type }: { type: Item["type"] }) {
  const isProduct = type === "product";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: isProduct ? "#0d2b1e" : "#14143b",
        color: isProduct ? "#3ECF8E" : "#818CF8",
        letterSpacing: "0.5px",
      }}
    >
      {isProduct ? "PRODUCTO" : "SERVICIO"}
    </span>
  );
}

function StockIndicator({ stock }: { stock: number | null }) {
  if (stock === null)
    return <span style={{ color: "#555", fontSize: 13 }}>—</span>;
  const color = stock === 0 ? "#EF4444" : stock <= 5 ? "#F59E0B" : "#9b9b9b";
  return (
    <span style={{ color, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
      {stock}
    </span>
  );
}

export function CatalogPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    type: "product",
    price: "",
    stock: "0",
  });

  useEffect(() => {
    if (!tenantId) return;
    
    useCases.manageCatalog
      .findAll(tenantId)
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error al cargar el catálogo");
        setLoading(false);
      });
  }, [tenantId]);

  const loadItems = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await useCases.manageCatalog.findAll(tenantId);
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar el catálogo");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSubmitting(true);
    try {
      const priceCents = Math.round(parseFloat(formData.price) * 100);
      await useCases.manageCatalog.createItem(
        {
          name: formData.name,
          type: formData.type,
          price: priceCents,
          stock: formData.type === "service" ? undefined : parseInt(formData.stock, 10),
        },
        tenantId
      );
      setIsCreateModalOpen(false);
      setFormData({ name: "", type: "product", price: "", stock: "0" });
      loadItems();
    } catch (err: any) {
      setError(err.message || "Error al crear item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !tenantId) return;
    setSubmitting(true);
    try {
      const priceCents = Math.round(parseFloat(formData.price) * 100);
      await useCases.manageCatalog.updateItem(
        editingItem.id,
        {
          name: formData.name,
          price: priceCents,
          stock: formData.type === "service" ? undefined : parseInt(formData.stock, 10),
        },
        tenantId
      );
      setEditingItem(null);
      setFormData({ name: "", type: "product", price: "", stock: "0" });
      loadItems();
    } catch (err: any) {
      setError(err.message || "Error al actualizar item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem || !tenantId) return;
    setSubmitting(true);
    try {
      await useCases.manageCatalog.deleteItem(deletingItem.id, tenantId);
      setDeletingItem(null);
      loadItems();
    } catch (err: any) {
      setError(err.message || "Error al eliminar item");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      price: (item.price / 100).toString(),
      stock: item.stock?.toString() ?? "0",
    });
  };

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "name",
    dir: "asc",
  });

  const filtered = items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sort.field === "name") cmp = a.name.localeCompare(b.name);
      if (sort.field === "price") cmp = a.price - b.price;
      if (sort.field === "stock") cmp = (a.stock ?? -1) - (b.stock ?? -1);
      if (sort.field === "type") cmp = a.type.localeCompare(b.type);
      return sort.dir === "asc" ? cmp : -cmp;
    });

  const toggleSort = (field: SortField) =>
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" },
    );

  const SortIcon = ({ field }: { field: SortField }) => (
    <span
      style={{
        marginLeft: 4,
        color:
          sort.field === field ? "var(--accent-color)" : "var(--text-muted)",
        fontSize: 10,
      }}
    >
      {sort.field === field ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Catálogo</h1>
          <p style={s.pageSubtitle}>
            {items.length} items ·{" "}
            {items.filter((i) => i.type === "product").length} productos ·{" "}
            {items.filter((i) => i.type === "service").length} servicios
          </p>
        </div>
        <button style={s.primaryBtn} onClick={() => {
          setFormData({ name: "", type: "product", price: "", stock: "0" });
          setIsCreateModalOpen(true);
        }}>+ Nuevo item</button>
      </div>

      {/* Toolbar */}
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
        <span style={s.resultCount}>
          {tenantLoading || loading ? "Cargando..." : `${filtered.length} resultados`}
        </span>
      </div>

      {tenantLoading || loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#555" }}>
          <p>Cargando datos...</p>
        </div>
      ) : error ? (
        <div
          style={{ textAlign: "center", padding: "48px 0", color: "#EF4444" }}
        >
          <p>Error: {error}</p>
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th
                  style={{ ...s.th, width: 300, cursor: "pointer" }}
                  onClick={() => toggleSort("name")}
                >
                  Nombre <SortIcon field="name" />
                </th>
                <th
                  style={{ ...s.th, cursor: "pointer" }}
                  onClick={() => toggleSort("type")}
                >
                  Tipo <SortIcon field="type" />
                </th>
                <th
                  style={{ ...s.th, textAlign: "right", cursor: "pointer" }}
                  onClick={() => toggleSort("price")}
                >
                  Precio <SortIcon field="price" />
                </th>
                <th
                  style={{ ...s.th, textAlign: "right", cursor: "pointer" }}
                  onClick={() => toggleSort("stock")}
                >
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
                    ((
                      e.currentTarget as HTMLTableRowElement
                    ).style.backgroundColor = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    ((
                      e.currentTarget as HTMLTableRowElement
                    ).style.backgroundColor = "transparent")
                  }
                >
                  <td style={s.td}>
                    <span
                      style={{
                        color: "#ededed",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      {item.name}
                    </span>
                  </td>
                  <td style={s.td}>
                    <TypeBadge type={item.type} />
                  </td>
                  <td
                    style={{
                      ...s.td,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      color: "#3ECF8E",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {formatMoney(createMoney(item.price, "PEN"))}
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    <StockIndicator stock={item.stock} />
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button style={s.ghostBtn} onClick={() => openEditModal(item)}>Editar</button>
                      <button
                        style={{ ...s.ghostBtn, color: "var(--error-color)" }}
                        onClick={() => setDeletingItem(item)}
                      >
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

      {!loading && !error && filtered.length === 0 && (
        <div style={s.emptyState}>
          <p style={{ color: "#555", fontSize: 14 }}>
            No se encontraron items para "{search}"
          </p>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div style={s.modalOverlay} onClick={() => setIsCreateModalOpen(false)}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Nuevo Item</h2>
            <form onSubmit={handleCreate}>
              <div style={s.formGroup}>
                <label style={s.label}>Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={s.input}
                  placeholder="Ej: Café latte"
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Tipo</label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="type"
                      value="product"
                      checked={formData.type === "product"}
                      onChange={() => setFormData({ ...formData, type: "product" })}
                    />
                    Producto
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="type"
                      value="service"
                      checked={formData.type === "service"}
                      onChange={() => setFormData({ ...formData, type: "service" })}
                    />
                    Servicio
                  </label>
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Precio (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  style={s.input}
                  placeholder="0.00"
                />
              </div>
              {formData.type === "product" && (
                <div style={s.formGroup}>
                  <label style={s.label}>Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    style={s.input}
                    placeholder="0"
                  />
                </div>
              )}
              <div style={s.buttonRow}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={s.cancelBtn}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div style={s.modalOverlay} onClick={() => setEditingItem(null)}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Editar Item</h2>
            <form onSubmit={handleUpdate}>
              <div style={s.formGroup}>
                <label style={s.label}>Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={s.input}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Tipo</label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="editType"
                      value="product"
                      checked={formData.type === "product"}
                      onChange={() => setFormData({ ...formData, type: "product" })}
                    />
                    Producto
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="editType"
                      value="service"
                      checked={formData.type === "service"}
                      onChange={() => setFormData({ ...formData, type: "service" })}
                    />
                    Servicio
                  </label>
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Precio (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  style={s.input}
                />
              </div>
              {formData.type === "product" && (
                <div style={s.formGroup}>
                  <label style={s.label}>Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    style={s.input}
                  />
                </div>
              )}
              <div style={s.buttonRow}>
                <button type="button" onClick={() => setEditingItem(null)} style={s.cancelBtn}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingItem && (
        <div style={s.modalOverlay} onClick={() => setDeletingItem(null)}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Eliminar Item</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              ¿Estás seguro de eliminar <strong>"{deletingItem.name}"</strong>?
            </p>
            <div style={s.buttonRow}>
              <button onClick={() => setDeletingItem(null)} style={s.cancelBtn}>
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                style={{ ...s.submitBtn, backgroundColor: "var(--error-color)", opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: "32px 40px", maxWidth: 1100 },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "var(--text-muted)",
    marginTop: 4,
    margin: 0,
  },
  primaryBtn: {
    backgroundColor: "var(--accent-color)",
    color: "#0f0f0f",
    border: "none",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
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
    textAlign: "left",
    borderBottom: "1px solid var(--border-color)",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
    userSelect: "none",
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
  emptyState: { textAlign: "center", padding: "48px 0" },
  modalOverlay: {
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
  },
  modalContent: {
    backgroundColor: "var(--bg-surface)",
    padding: "2rem",
    borderRadius: "8px",
    width: "400px",
    maxWidth: "90%",
  },
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
