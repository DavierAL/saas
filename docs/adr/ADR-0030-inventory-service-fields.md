# ADR-0030: Ocultar campos de inventario para servicios

**Fecha:** 2026-05-10  
**Estado:** Completado  
**Autor:** Davier  
**Tags:** `#inventory` `#services` `#ux` `#columns`

---

## Contexto

En barberías y otros negocios donde el catálogo incluye servicios (cortes de pelo, etc.), los items de tipo `service` muestran campos irrelevantes como:
- Código de barras
- Stock
- Costo
- Margen %
- Marca
- Variante
- Peso/Cant
- Stk Min
- Tiene FV?
- VTO
- Comentarios Venc.

Estos campos no aplican para servicios que no tienen inventario físico.

---

## Decisión

Ocultar automáticamente las columnas de inventario físico cuando:
1. **Todos los items son servicios** (`item.type === 'service'`)
2. **El tenant es una barbería** (`industryType === 'barbershop'`)

---

## Cambios Realizados

### 1. `apps/web/src/pages/InventoryPage.tsx`

```tsx
import { useTenant } from "../hooks/useTenant";

export default function InventoryPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const { tenant } = useTenant(tenantId ?? null);
  // ...
  <InventoryTable items={items} industryType={tenant?.industry_type} />
}
```

### 2. `apps/web/src/components/inventory/InventoryTable.tsx`

```tsx
type InventoryTableProps = {
  items: Item[];
  industryType?: IndustryType;
};

export function InventoryTable({ items, industryType }: InventoryTableProps) {
  const allItemsAreServices = items.length > 0 && items.every(item => item.type === "service");
  const hideInventoryColumns = allItemsAreServices || industryType === "barbershop";

  // En el renderizado de headers y celdas:
  {!hideInventoryColumns && <th>Código Barras</th>}
  {!hideInventoryColumns && <td>{item.barcode || "—"}</td>}
  // ... todos los campos de inventario físico
}
```

---

## Columnas afectadas (ocultas para servicios/barberías)

| Columna | Visible para productos |
|---------|----------------------|
| Código Barras | ✅ |
| Stock | ✅ |
| Costo | ✅ |
| Mgn % | ✅ |
| Marca | ✅ |
| Variante | ✅ |
| Peso/Cant | ✅ |
| Stk Min | ✅ |
| Tiene FV? | ✅ |
| VTO | ✅ |
| Comentarios Venc. | ✅ |

**Siempre visibles:** SKU, Imagen, Venta, Categoría, Descripción

---

## Verificación

```bash
npm run typecheck
# Resultado: 14 successful, 14 total ✅
```

---

## Notas

- La lógica `hideInventoryColumns` se evalúa a nivel de tabla, no por fila
- Si hay productos Y servicios mezclados, se muestran todas las columnas (comportamiento seguro)
- El campo `industryType` se pasa desde el tenant para permitir扩展 futura por industria

---

## Referencias

- Entidad Tenant: `packages/domain/src/entities/tenant.ts`
- Tipos: `IndustryType = 'restaurant' | 'barbershop' | 'retail'`
- Item types: `'product' | 'service'`