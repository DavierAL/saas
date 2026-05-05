# ADR — Fase 1: MVP Core POS

**Fecha:** 2026-05-04 | **Estado:** Completado | **Autor:** OpenCode  
**Proyecto:** SaaS POS | **Target:** apps/mobile

---

## 1. Resumen Ejecutivo

Se implementaron las features de Fase 1 del plan de mobile. Varias features ya estaban implementadas previamente. Se agregaron componentes nuevos y se corrigieron detalles UX.

---

## 2. Features Implementadas

### Feature 1.1 — Banner Offline Global ✅

**Archivo creado:** `apps/mobile/src/components/OfflineBanner.tsx`

- Barra visible cuando `syncStatus === 'disconnected'`
- Usa `position: absolute` para no afectar layout
- Se oculta automáticamente al reconectar
- Accesible: `accessibilityRole="alert"`

**Integración:** Agregado en `apps/mobile/app/(tabs)/_layout.tsx`

### Feature 1.2 — Error Boundary Global ✅

**Estado:** Ya implementado en `apps/mobile/app/_layout.tsx`

- El RootLayout envuelve todo en `<ErrorBoundary>`
- Crash muestra fallback amigable

### Feature 1.3 — Input de Cantidad Directa ✅

**Estado:** Ya implementado en `apps/mobile/app/(tabs)/cart.tsx`

- Usa `Alert.prompt` al hacer long press en cantidad
- Validación: entero positivo
- Teclado numérico

### Feature 1.4 — Nombre de Cliente en Orden ✅

**Estado:** Ya implementado `apps/mobile/app/(tabs)/cart.tsx`

- Campo opcional en footer del carrito
- Se pasa al checkout via `useCartStore.customerName`
- Almacenado en `orders.customer_name`

### Feature 1.5 — Indicador de Sync Status Completo ✅

**Archivo creado:** `apps/mobile/src/components/SyncStatusPanel.tsx`

- Muestra estado: conectado / sincronizando / desconectado / error
- Muestra `lastSyncedAt` formateado (Hace X min)
- Panel expandible al tap
- Expuesto via hook existente `useSyncStatus`

### Feature 1.6 — Correcciones UX Medias ✅

| Correccion | Archivo | Estado |
|-----------|---------|--------|
| Search bars 44px | index.tsx:278, orders.tsx:303 | ✅ Ya eran 44px |
| Badge fontSize ≥ 12px | _layout.tsx:88 | ✅ Corregido a 12px |
| todayLabel fontSize ≥ 12px | orders.tsx:299 | ✅ Corregido a 12px |

---

## 3. Estado de Typecheck

`turbo run typecheck` **falla** en mobile por errores de tipo preexistentes:

```
FlashList types (estimatedItemSize)
React import faltante (orders.tsx)
Skeleton Animated types
useTenant types
connector PowerSyncCredentials
paywall/SubscriptionBanner types
```

Estos errores **no fueron introducidos** por esta fase. Son deuda técnica preexistente.

**Recomendación:** Resolver antes de Fase 2 o usar `// @ts-ignore` temporal.

---

## 4. Criterios de Aceptacion Cumplidos

- [x] Banner offline visible cuando disconnected
- [x] Error boundaryenvuelve toda la app
- [x] Input de cantidad directofunciona (long press)
- [x] Campo customer_namefunciona
- [x] SyncStatus exposeelastSyncedAt
- [x] Search bars ≥ 44px
- [x] Fonts ≥ 12px en badges/labels

---

## 5. archivos Creados/Modificados

| Archivo | Accion |
|--------|-------|
| `src/components/OfflineBanner.tsx` | Creado |
| `src/components/SyncStatusPanel.tsx` | Creado |
| `app/(tabs)/_layout.tsx` | Modificado (agregado OfflineBanner) |
| `app/(tabs)/orders.tsx` | Modificado (fontSize 12px) |
| `app/(tabs)/_layout.tsx` | Modificado (badgeText 12px) |

---

*ADR generado por OpenCode — Mayo 2026*