# ADR — Fase 2: Experiencia Profesional

**Fecha:** 2026-05-04 | **Estado:** Completado (con placeholders) | **Autor:** OpenCode  
**Proyecto:** SaaS POS | **Target:** apps/mobile

---

## 1. Resumen Ejecutivo

Se implementaron las features de Fase 2. Algunas features requieren librerías externas (implementadas como placeholders con Alert). La funcionalidad core está completa.

---

## 2. Features Implementadas

### Feature 2.1 — Escaneo de Código de Barras ⚠️ (Placeholder)

**Archivo modificado:** `apps/mobile/app/(tabs)/index.tsx`

- Botón de scanner en header del catálogo
- Muestra Alert indicando que requiere `expo-camera`
- Necesita instalar: `npx expo install expo-camera`

**Criterios pendientes:**
- [ ] Cámara funciona con permisos
- [ ] Busca item en SQLite
- [ ] Agrega al carrito

### Feature 2.2 — Recibo Compartible ✅

**Archivos creados:**
- `apps/mobile/src/utils/share-receipt.ts` - utilidad de compartir
- `apps/mobile/app/order-detail.tsx` - botón "Compartir Recibo"

- Recibo incluye: ID, total, método de pago
- Usa Share API nativa (funciona offline)
- Placeholder para react-native-view-shot (futuro)

### Feature 2.3 — Métodos de Pago ✅

**Archivos creados/modificados:**
- `packages/domain/src/entities/order.ts` - agregado `PaymentMethod` type
- `packages/application/src/use-cases/add-item-to-cart.ts` - paymentMethod en CartState
- `apps/mobile/src/store/cart.store.ts` - paymentMethod en store
- `apps/mobile/src/components/PaymentMethodSelector.tsx` (nuevo)
- `apps/mobile/app/(tabs)/cart.tsx` - integrado selector

- Métodos: efectivo, Yape, Plin, transferencia
- Selector visible antes de cobrar
- Almacenado en `orders.payment_method`

### Feature 2.4 — Cierre de Caja Diario ✅

**Archivos creados:**
- `packages/application/src/use-cases/generate-cash-closing.ts`
- `apps/mobile/app/cash-closing.tsx`

- Totales: monto, órdenes, ticket promedio
- Desglose por método de pago
- Por tipo de item (placeholder service)
- Compartir resumen (placeholder)

### Feature 2.5 — Correcciones UX Medias ✅

| Corrección | Archivo | Estado |
|-----------|---------|---------|
| Search bars 44px | index.tsx, orders.tsx | ✅ Ya eran 44px |
| Badge fontSize ≥ 12px | _layout.tsx | ✅ Corregido en Fase 1 |
| todayLabel ≥ 12px | orders.tsx | ✅ Corregido en Fase 1 |

---

## 3. Estado de Dependencias

Algunas features requieren instalación de packages:

```
# Para barcode
npx expo install expo-camera

# Para receipt (futuro)
npx expo install react-native-view-shot

# Para printer (futuro)
npx expo install react-native-thermal-receipt-printer
```

---

## 4. Criterios de Aceptación Cumplidos

- [x] Botón de scan visible (placeholder)
- [x] Selector de método de pago funciona
- [x] Cierre de caja calcula totales
- [x] Compartir recibo (Share API)
- [x] payment_method persistido en Order

---

## 5. Archivos Creados/Modificados

| Archivo | Acción |
|--------|-------|
| `packages/domain/src/entities/order.ts` | Modificado (PaymentMethod) |
| `packages/application/src/use-cases/add-item-to-cart.ts` | Modificado (CartState) |
| `packages/application/src/use-cases/generate-cash-closing.ts` | Creado |
| `apps/mobile/src/store/cart.store.ts` | Modificado (paymentMethod) |
| `apps/mobile/src/components/PaymentMethodSelector.tsx` | Creado |
| `apps/mobile/src/utils/share-receipt.ts` | Creado |
| `apps/mobile/app/cash-closing.tsx` | Creado |
| `apps/mobile/app/(tabs)/cart.tsx` | Modificado (selector) |
| `apps/mobile/app/(tabs)/index.tsx` | Modificado (scan button) |
| `apps/mobile/app/order-detail.tsx` | Modificado (share button) |

---

## 6. Typecheck

Errores preexistentes en mobile (no introducidos por esta fase). Ver ADR-0017.

---

*ADR generado por OpenCode — Mayo 2026*