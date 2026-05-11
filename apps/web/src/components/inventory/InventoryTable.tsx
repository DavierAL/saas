import { useState } from "react";
import type { CSSProperties } from "react";
import type { Item, IndustryType } from "@saas-pos/domain";
import { formatMoney, createMoney } from "@saas-pos/domain";

type InventoryTableProps = {
  items: Item[];
  industryType?: IndustryType;
};

export function InventoryTable({ items, industryType }: InventoryTableProps) {
  const allItemsAreServices = items.length > 0 && items.every(item => item.type === "service");
  const hideInventoryColumns = allItemsAreServices || industryType === "barbershop";

  return (
    <div style={s.tableWrap}>
      <div style={s.tableScroll}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: 60 }}>Tipo</th>
              <th style={s.th}>Nombre</th>
              <th style={s.th}>SKU</th>
              {!hideInventoryColumns && <th style={s.th}>Código</th>}
              <th style={{ ...s.th, width: 70 }}>Img</th>
              {!hideInventoryColumns && <th style={{ ...s.th, textAlign: "center" }}>Stock</th>}
              {hideInventoryColumns && <th style={{ ...s.th, textAlign: "center" }}>Duración</th>}
              {!hideInventoryColumns && <th style={{ ...s.th, textAlign: "right" }}>Costo</th>}
              <th style={{ ...s.th, textAlign: "right" }}>Venta</th>
              {!hideInventoryColumns && <th style={{ ...s.th, textAlign: "center" }}>Margen</th>}
              {!hideInventoryColumns && <th style={s.th}>Marca</th>}
              <th style={s.th}>Categoría</th>
              {!hideInventoryColumns && <th style={s.th}>Variante</th>}
              <th style={{ ...s.th, maxWidth: 180 }}>Descripción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <InventoryRow 
                key={item.id} 
                item={item} 
                hideInventoryColumns={hideInventoryColumns}
                index={index}
              />
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && (
        <div style={s.emptyState}>
          <span style={s.emptyIcon}>📦</span>
          <p style={s.emptyText}>No hay items en el inventario</p>
          <p style={s.emptySubtext}>Agrega productos o servicios para comenzar</p>
        </div>
      )}
    </div>
  );
}

function InventoryRow({ item, hideInventoryColumns, index }: { 
  item: Item; 
  hideInventoryColumns: boolean;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const margin = item.cost && item.price ? Math.round(((item.price - item.cost) / item.price) * 100) : null;
  const isLowStock = item.stock !== null && (item.min_stock ? item.stock <= item.min_stock : item.stock <= 5);
  const isService = item.type === "service";

  const getMarginColor = (m: number) => {
    if (m >= 25) return '#3ECF8E';
    if (m >= 15) return '#F59E0B';
    return '#EF4444';
  };

  const getStockStyle = (): CSSProperties => {
    const baseStyle = s.td || {};
    if (isService) return baseStyle;
    if (item.stock === 0) return { ...baseStyle, color: '#EF4444', fontWeight: 700 };
    if (isLowStock) return { ...baseStyle, color: '#F59E0B', fontWeight: 600 };
    return baseStyle;
  };

  return (
    <tr 
      style={{ 
        ...s.tr, 
        backgroundColor: isHovered ? 'var(--bg-hover)' : 'transparent',
        animation: `fadeIn 0.3s ease-out both`,
        animationDelay: `${index * 30}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <td style={s.td}>
        <span style={{
          ...s.typeBadge,
          backgroundColor: isService ? 'rgba(129, 140, 248, 0.15)' : 'rgba(62, 211, 142, 0.15)',
          color: isService ? '#818CF8' : '#3ECF8E',
        }}>
          {isService ? 'SERVICE' : 'PRODUCT'}
        </span>
      </td>
      <td style={{ ...s.td, fontWeight: 600, color: 'var(--text-primary)', minWidth: 150 }}>
        {item.name}
      </td>
      <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{item.sku || '—'}</td>
      {!hideInventoryColumns && <td style={{ ...s.td, fontFamily: 'monospace', fontSize: 12 }}>{item.barcode || '—'}</td>}
      <td style={s.td}>
        {item.image_url ? (
          <div style={s.imgWrap}>
            <img src={item.image_url} alt={item.name} style={s.thumbnail} />
          </div>
        ) : (
          <span style={s.noImage}>—</span>
        )}
      </td>
      {!hideInventoryColumns && (
        <td style={{ ...getStockStyle(), textAlign: 'center' }}>
          {isService ? '—' : (
            <span style={{
              ...s.stockBadge,
              backgroundColor: item.stock === 0 ? 'rgba(239, 68, 68, 0.15)' : isLowStock ? 'rgba(245, 158, 11, 0.15)' : 'rgba(62, 211, 142, 0.15)',
              color: item.stock === 0 ? '#EF4444' : isLowStock ? '#F59E0B' : '#3ECF8E',
            }}>
              {item.stock}
            </span>
          )}
        </td>
      )}
      {hideInventoryColumns && (
        <td style={{ ...s.td, textAlign: 'center' }}>
          {item.duration_minutes ? (
            <span style={{
              ...s.stockBadge,
              backgroundColor: 'rgba(129, 140, 248, 0.15)',
              color: '#818CF8',
            }}>
              {item.duration_minutes} min
            </span>
          ) : '—'}
        </td>
      )}
      {!hideInventoryColumns && (
        <td style={{ ...s.td, textAlign: 'right', fontFamily: 'monospace' }}>
          {item.cost ? formatMoney(createMoney(item.cost, "PEN")) : '—'}
        </td>
      )}
      <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, color: '#3ECF8E' }}>
        {formatMoney(createMoney(item.price, "PEN"))}
      </td>
      {!hideInventoryColumns && (
        <td style={{ ...s.td, textAlign: 'center' }}>
          {margin !== null ? (
            <span style={{ 
              color: getMarginColor(margin), 
              fontWeight: 700,
              fontSize: 12,
            }}>
              {margin}%
            </span>
          ) : '—'}
        </td>
      )}
      {!hideInventoryColumns && <td style={s.td}>{item.brand || '—'}</td>}
      <td style={s.td}>
        {item.category ? (
          <span style={s.categoryBadge}>{item.category}</span>
        ) : '—'}
      </td>
      {!hideInventoryColumns && <td style={s.td}>{item.variant || '—'}</td>}
      <td style={{ ...s.td, maxWidth: 180 }}>
        <span style={s.descText}>{item.description || '—'}</span>
      </td>
    </tr>
  );
}

const s: Record<string, CSSProperties> = {
  tableWrap: {
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 12,
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  tableScroll: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    minWidth: 900,
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 12px',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-color)',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    backgroundColor: 'var(--bg-surface)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  tr: {
    transition: 'background-color 0.15s ease',
  },
  td: {
    padding: '12px',
    fontSize: 13,
    color: 'var(--text-secondary)',
    borderBottom: '1px solid var(--border-light)',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  },
  thumbnail: {
    width: 36,
    height: 36,
    objectFit: 'cover',
    borderRadius: 6,
    border: '1px solid var(--border-light)',
  },
  imgWrap: {
    display: 'flex',
    justifyContent: 'center',
  },
  noImage: {
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  typeBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap',
  },
  stockBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    minWidth: 32,
    textAlign: 'center',
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: 'var(--bg-hover)',
    borderRadius: 4,
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
  descText: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    display: 'block',
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'var(--text-muted)',
    margin: '8px 0 0',
  },
};