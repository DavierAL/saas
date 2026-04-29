# ADR-011: Sincronización Exitosa — Ajuste de Claims y Moneda Dinámica

**Estado:** Aceptado  
**Fecha:** 2026-04-28  
**Contexto:** SaaS POS — App Móvil (Expo + PowerSync + Supabase)

---

## Contexto del problema

Tras la configuración inicial de los Sync Streams (ADR-010), el catálogo seguía vacío en la aplicación móvil a pesar de haber corregido el esquema de la base de datos. La investigación reveló que las Sync Rules intentaban extraer el `tenant_id` desde `user_metadata`, pero la implementación de Supabase lo incluía en la raíz del JWT. Además, la UI mostraba valores en 'PEN' de forma estática, ignorando la configuración del tenant.

---

## Decisiones tomadas

### D1 — Uso de Claims de Raíz en Sync Rules
Se determinó que el claim `tenant_id` reside en la raíz del payload del JWT (no anidado en `user_metadata`). Esto se confirmó mediante:
1. La función SQL `public.tenant_id()` en Supabase.
2. La lógica de extracción en `AppProvider.tsx`.
3. El fallo de sincronización cuando se usaba la ruta anidada.

**Acción:** Se actualizó `powersync.yaml` para usar `auth.parameter('tenant_id')` directamente en todas las queries de filtrado.

### D2 — Observabilidad Reactiva de Sincronización
Para diagnosticar estados de carga infinitos, se añadió un listener de estado en el `SyncController`.
- **Implementación:** `db.onChange` en `AppProvider.tsx` registra cambios en `connected` y `hasSynced`.
- **Beneficio:** Permite verificar visualmente en los logs de Metro si PowerSync ha completado su ciclo inicial.

### D3 — Implementación de Moneda Dinámica (Tenant-Aware)
El sistema local-first debe respetar la configuración del tenant sincronizada desde la nube.
- **Acción:** Creación del hook `useTenant` que observa la tabla `tenants` en SQLite local.
- **Cambio en UI:** La pantalla de catálogo (`index.tsx`) ahora consume `tenant.currency` para formatear los precios.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `packages/sync/powersync.yaml` | Corrección de queries para usar `auth.parameter('tenant_id')`. |
| `apps/mobile/src/providers/AppProvider.tsx` | Adición de `statusUnsubscribe` en `SyncController`. |
| `apps/mobile/src/hooks/useTenant.ts` | [NUEVO] Hook para observar datos del tenant en SQLite. |
| `apps/mobile/app/(tabs)/index.tsx` | Uso de `useTenant` y renderizado de precios con moneda dinámica. |

---

## Verificación

1. **Logs de PowerSync:** Al iniciar sesión, se observa `[SyncController] Status Change: Connected (hasSynced: true)`.
2. **Catálogo de Items:** Los 5 items de Supabase se visualizan correctamente en la lista.
3. **Moneda:** Los precios se muestran en la moneda configurada en el registro del tenant en Supabase (ej: 'USD' o 'PEN').

---

## Consecuencias

**Positivas:**
- Sincronización funcional al 100%.
- UI coherente con la configuración del comercio (moneda).
- Mejor capacidad de diagnóstico para futuros problemas de red.

**Pendientes:**
- Resolver el error HTTP 400 en la Edge Function `validate-subscription` (causa probable: falta de variables de entorno en el servidor de Supabase).
