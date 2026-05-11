import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type { Item, ItemType } from "@saas-pos/domain";
import { Modal } from "@saas-pos/ui";

type ItemFormData = {
  name: string;
  type: ItemType;
  price: string;
  stock: string;
  duration_minutes: string;
  sku: string;
  barcode: string;
  image_url: string;
  cost: string;
  brand: string;
  category: string;
  variant: string;
  weight_quantity: string;
  min_stock: string;
  description: string;
  has_expiry: boolean;
  expiry_date: string;
  expiry_comments: string;
};

type ItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ItemFormData) => Promise<void>;
  editingItem?: Item | null;
  submitting: boolean;
};

const emptyForm: ItemFormData = {
  name: "", type: "product", price: "", stock: "0", duration_minutes: "",
  sku: "", barcode: "", image_url: "", cost: "",
  brand: "", category: "", variant: "", weight_quantity: "",
  min_stock: "5", description: "",
  has_expiry: false, expiry_date: "", expiry_comments: "",
};

export function ItemModal({ isOpen, onClose, onSubmit, editingItem, submitting }: ItemModalProps) {
  const [formData, setFormData] = useState<ItemFormData>(emptyForm);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        type: editingItem.type,
        price: (editingItem.price / 100).toString(),
        stock: editingItem.stock?.toString() ?? "0",
        duration_minutes: editingItem.duration_minutes?.toString() ?? "",
        sku: editingItem.sku ?? "",
        barcode: editingItem.barcode ?? "",
        image_url: editingItem.image_url ?? "",
        cost: editingItem.cost ? (editingItem.cost / 100).toString() : "",
        brand: editingItem.brand ?? "",
        category: editingItem.category ?? "",
        variant: editingItem.variant ?? "",
        weight_quantity: editingItem.weight_quantity ?? "",
        min_stock: editingItem.min_stock?.toString() ?? "5",
        description: editingItem.description ?? "",
        has_expiry: editingItem.has_expiry ?? false,
        expiry_date: editingItem.expiry_date ?? "",
        expiry_comments: editingItem.expiry_comments ?? "",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  const updateField = <K extends keyof ItemFormData>(field: K, value: ItemFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isProduct = formData.type === "product";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingItem ? "Editar Item" : "Nuevo Item"}>
      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.section}>
          <h4 style={s.sectionTitle}>Información Basic</h4>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Nombre *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                style={s.input}
                placeholder="Ej: Café latte"
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Tipo</label>
              <div style={s.radioGroup}>
                <label style={s.radioLabel}>
                  <input type="radio" name="type" value="product" checked={formData.type === "product"} onChange={() => updateField("type", "product")} />
                  Producto
                </label>
                <label style={s.radioLabel}>
                  <input type="radio" name="type" value="service" checked={formData.type === "service"} onChange={() => updateField("type", "service")} />
                  Servicio
                </label>
              </div>
            </div>
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Precio Venta (S/) *</label>
              <input type="number" step="0.01" min="0" value={formData.price} onChange={(e) => updateField("price", e.target.value)} required style={s.input} placeholder="0.00" />
            </div>
            {isProduct && (
              <div style={s.field}>
                <label style={s.label}>Stock</label>
                <input type="number" min="0" value={formData.stock} onChange={(e) => updateField("stock", e.target.value)} style={s.input} placeholder="0" />
              </div>
            )}
            {isProduct && (
              <div style={s.field}>
                <label style={s.label}>Stock Mín.</label>
                <input type="number" min="0" value={formData.min_stock} onChange={(e) => updateField("min_stock", e.target.value)} style={s.input} placeholder="5" />
              </div>
            )}
            {!isProduct && (
              <div style={s.field}>
                <label style={s.label}>Duración (min)</label>
                <input type="number" min="1" value={formData.duration_minutes} onChange={(e) => updateField("duration_minutes", e.target.value)} style={s.input} placeholder="30" />
              </div>
            )}
          </div>
        </div>

        {isProduct && (
          <>
            <div style={s.section}>
              <h4 style={s.sectionTitle}>Identificación</h4>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>SKU</label>
                  <input type="text" value={formData.sku} onChange={(e) => updateField("sku", e.target.value)} style={s.input} placeholder="SKU-001" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Código Barras</label>
                  <input type="text" value={formData.barcode} onChange={(e) => updateField("barcode", e.target.value)} style={s.input} placeholder="1234567890123" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Imagen URL</label>
                  <input type="url" value={formData.image_url} onChange={(e) => updateField("image_url", e.target.value)} style={s.input} placeholder="https://..." />
                </div>
              </div>
            </div>

            <div style={s.section}>
              <h4 style={s.sectionTitle}>Detalles</h4>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>Marca</label>
                  <input type="text" value={formData.brand} onChange={(e) => updateField("brand", e.target.value)} style={s.input} placeholder="Ej: Gloria" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Categoría</label>
                  <input type="text" value={formData.category} onChange={(e) => updateField("category", e.target.value)} style={s.input} placeholder="Ej: Lácteos" />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Variante</label>
                  <input type="text" value={formData.variant} onChange={(e) => updateField("variant", e.target.value)} style={s.input} placeholder="Ej: 1L" />
                </div>
              </div>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>Peso/Cantidad</label>
                  <input type="text" value={formData.weight_quantity} onChange={(e) => updateField("weight_quantity", e.target.value)} style={s.input} placeholder="Ej: 500g" />
                </div>
                <div style={{ ...s.field, flex: 2 }}>
                  <label style={s.label}>Descripción Amigable</label>
                  <input type="text" value={formData.description} onChange={(e) => updateField("description", e.target.value)} style={s.input} placeholder="Descripción visible para clientes" />
                </div>
              </div>
            </div>

            <div style={s.section}>
              <h4 style={s.sectionTitle}>Costos</h4>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.label}>Costo Unitario (S/)</label>
                  <input type="number" step="0.01" min="0" value={formData.cost} onChange={(e) => updateField("cost", e.target.value)} style={s.input} placeholder="0.00" />
                </div>
              </div>
            </div>

            <div style={s.section}>
              <h4 style={s.sectionTitle}>Vencimiento</h4>
              <div style={s.row}>
                <div style={s.field}>
                  <label style={s.checkboxLabel}>
                    <input type="checkbox" checked={formData.has_expiry} onChange={(e) => updateField("has_expiry", e.target.checked)} />
                    Tiene fecha de vencimiento
                  </label>
                </div>
              </div>
              {formData.has_expiry && (
                <div style={s.row}>
                  <div style={s.field}>
                    <label style={s.label}>Fecha VTO</label>
                    <input type="date" value={formData.expiry_date} onChange={(e) => updateField("expiry_date", e.target.value)} style={s.input} />
                  </div>
                  <div style={{ ...s.field, flex: 2 }}>
                    <label style={s.label}>Comentarios</label>
                    <input type="text" value={formData.expiry_comments} onChange={(e) => updateField("expiry_comments", e.target.value)} style={s.input} placeholder="Notas sobre el vencimiento" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div style={s.buttonRow}>
          <button type="button" onClick={onClose} style={s.cancelBtn}>Cancelar</button>
          <button type="submit" disabled={submitting} style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? (editingItem ? "Guardando..." : "Creando...") : editingItem ? "Guardar" : "Crear"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const s: Record<string, CSSProperties> = {
  form: { maxHeight: "70vh", overflowY: "auto", paddingRight: "0.5rem" },
  section: { marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-light)" },
  sectionTitle: { margin: "0 0 1rem 0", fontSize: 14, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" },
  row: { display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" },
  field: { flex: 1, minWidth: 120 },
  label: { display: "block", marginBottom: "0.35rem", fontSize: 13 },
  input: { width: "100%", padding: "0.5rem", backgroundColor: "var(--bg-base)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "4px", fontSize: 14 },
  radioGroup: { display: "flex", gap: "1rem" },
  radioLabel: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 },
  checkboxLabel: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 },
  buttonRow: { display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1.5rem", paddingTop: "1rem" },
  cancelBtn: { padding: "0.6rem 1.2rem", backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" },
  submitBtn: { padding: "0.6rem 1.2rem", backgroundColor: "var(--accent-color)", color: "#0f0f0f", border: "none", borderRadius: "4px", fontWeight: 600, cursor: "pointer" },
};