import type { CSSProperties } from "react";
import type { Item } from "@saas-pos/domain";
import { formatMoney, createMoney } from "@saas-pos/domain";

type InventoryTableProps = {
  items: Item[];
  lowStockItems?: Item[];
};

export function InventoryTable({ items }: InventoryTableProps) {
  return (
    <div style={s.tableWrap}>
      <div style={s.tableScroll}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>SKU</th>
              <th style={s.th}>Código Barras</th>
              <th style={s.th}>Imagen</th>
              <th style={s.th}>Stock</th>
              <th style={s.th}>Costo</th>
              <th style={s.th}>Venta</th>
              <th style={s.th}>Mgn %</th>
              <th style={s.th}>Marca</th>
              <th style={s.th}>Categoría</th>
              <th style={s.th}>Variante</th>
              <th style={s.th}>Peso/Cant</th>
              <th style={s.th}>Stk Min</th>
              <th style={s.th}>Descripción</th>
              <th style={s.th}>Tiene FV?</th>
              <th style={s.th}>VTO</th>
              <th style={s.th}>Comentarios Venc.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const margin = item.cost && item.price ? Math.round(((item.price - item.cost) / item.price) * 100) : null;
              const isLowStock = item.stock !== null && (item.min_stock ? item.stock <= item.min_stock : item.stock <= 5);
              const isService = item.type === "service";

              return (
                <tr key={item.id} style={s.tr}>
                  <td style={s.td}>{item.sku || "—"}</td>
                  <td style={s.td}>{item.barcode || "—"}</td>
                  <td style={s.td}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} style={s.thumbnail} />
                    ) : (
                      <span style={s.noImage}>—</span>
                    )}
                  </td>
                  <td style={{ ...s.td, fontWeight: isLowStock && !isService ? 700 : 400, color: isLowStock && !isService ? "#F59E0B" : "inherit" }}>
                    {isService ? "—" : item.stock}
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    {item.cost ? formatMoney(createMoney(item.cost, "PEN")) : "—"}
                  </td>
                  <td style={{ ...s.td, textAlign: "right", color: "#3ECF8E", fontWeight: 600 }}>
                    {formatMoney(createMoney(item.price, "PEN"))}
                  </td>
                  <td style={{ ...s.td, textAlign: "right" }}>
                    {margin !== null ? (
                      <span style={{ color: margin >= 20 ? "#3ECF8E" : margin >= 10 ? "#F59E0B" : "#EF4444", fontWeight: 600 }}>{margin}%</span>
                    ) : "—"}
                  </td>
                  <td style={s.td}>{item.brand || "—"}</td>
                  <td style={s.td}>{item.category || "—"}</td>
                  <td style={s.td}>{item.variant || "—"}</td>
                  <td style={s.td}>{item.weight_quantity || "—"}</td>
                  <td style={{ ...s.td, textAlign: "center" }}>{item.min_stock ?? 5}</td>
                  <td style={{ ...s.td, maxWidth: 150 }}>{item.description || "—"}</td>
                  <td style={{ ...s.td, textAlign: "center" }}>
                    {item.has_expiry ? "✅" : "—"}
                  </td>
                  <td style={s.td}>
                    {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString("es-PE") : "—"}
                  </td>
                  <td style={{ ...s.td, maxWidth: 120 }}>{item.expiry_comments || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
  tableScroll: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: 1400,
    borderCollapse: "collapse",
  },
  th: {
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textAlign: "left",
    borderBottom: "1px solid var(--border-color)",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  tr: {
    transition: "background 0.1s",
  },
  td: {
    padding: "10px 12px",
    fontSize: 13,
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-light)",
    whiteSpace: "nowrap",
  },
  thumbnail: {
    width: 40,
    height: 40,
    objectFit: "cover",
    borderRadius: 4,
  },
  noImage: {
    color: "var(--text-muted)",
  },
};