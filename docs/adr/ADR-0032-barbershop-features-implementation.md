# ADR-0032: Migración de Esquema para Soporte Completo de Barberías

## Estado
- **Fecha**: 2026-05-10
- **Autor**: Davier
- **Estado**: Aceptado e Implementado

## Contexto

Derivado del plan propuesto en el **[ADR-0031](./ADR-0031-barbershop-optimization-plan.md)**, se identificó que el esquema actual de base de datos (diseñado inicialmente para un POS más genérico enfocado en retail/restaurantes) carecía de campos esenciales para el correcto funcionamiento de una barbería profesional (gestión de personal especializado, clientes recurrentes, propinas y tiempos de servicio).

Para no ensuciar la base de código con "hacks" (como inyectar todo en el campo JSON `raw_user_meta_data`), se decidió que era mandatorio realizar modificaciones estructurales directas a las tablas core en Supabase, así como al esquema local de PowerSync para soportar la aplicación móvil de manera offline.

## Decisiones Técnicas y Justificación

### 1. Extensión del Constraint de Roles (Rol: `staff`)
Se eliminaron y recrearon los `CHECK constraints` de roles en las tablas `public.users` y `public.tenant_members` para permitir el nuevo rol `'staff'`.
- **Justificación**: Se necesitaba una forma de otorgar acceso a la plataforma a los profesionales (barberos, estilistas) sin给他们 privilegios totales de caja (`cashier`) o configuración (`admin`), restringiéndolos exclusivamente a sus agendas.

### 2. Creación de la Entidad Clientes (`public.customers`)
Se creó una nueva tabla dedicada para clientes con soporte RLS.
- **Justificación**: Anteriormente el nombre del cliente se guardaba como simple texto libre en las órdenes y citas (`customer_name: string`). Un modelo de barbería requiere **retención de clientes**, revisar el historial de visitas, frecuencias y **notas de preferencias** (ej. "Prefiere el número 2 a los lados").

### 3. Trazabilidad en Citas (`public.appointments`)
Se agregaron las llaves foráneas `barber_id` (vinculado a `users`) y `customer_id` (vinculado a `customers`).
- **Justificación**: Vital para mostrar vistas de calendario filtradas por empleado, y fundamental para que el cliente se atienda con su barbero favorito.

### 4. Trazabilidad en Ventas y Propinas (`public.orders`)
Se agregó la columna `tip_amount` (INTEGER) y la relación `customer_id`.
- **Justificación**: La propina es un ingreso que no pertenece al negocio sino al empleado. Mezclarla con el `total_amount` destruiría la contabilidad del negocio al momento de calcular impuestos o cierre de caja. El separar este campo permite hacer cierres diarios exactos.

### 5. Parámetros de Agendamiento en Servicios (`public.items`)
Se agregó el campo `duration_minutes` (INTEGER).
- **Justificación**: Sin este campo, el sistema no tiene forma de saber cuántos bloques de 15, 30 o 45 minutos bloquear en el calendario cuando un cliente agenda un "Corte de Cabello" vs un "Corte + Barba".

### 6. Comisiones Nativas (`public.tenant_members`)
Se agregó el campo `commission_rate` (NUMERIC).
- **Justificación**: Aunque inicialmente se probó guardar comisiones en metadata JSON, moverlo a una columna explícita de Postgres permite ejecutar reportes analíticos complejos muy rápidos directamente con SQL (ej: `SUM(total_amount) * commission_rate`).

### 7. Sincronización Inmediata con PowerSync
El esquema en `packages/sync/src/powersync-schema.ts` fue actualizado obligatoriamente con todos estos nuevos campos.
- **Justificación**: Como la aplicación utiliza PowerSync para soporte *Offline-first*, la base de datos local SQLite debe replicar exactamente la estructura de Postgres. Omitir este paso hubiera causado errores silenciosos o crashes en la app móvil.

## Features Implementadas

### 1. Propinas (Tip Amount)

**Problema**: No se registraban propinas en las órdenes.

**Solución**:
- Agregado campo `tip_amount: number` a la interfaz `Order` en `packages/domain/src/entities/order.ts`
- Actualizado schema PostgreSQL: `tip_amount INTEGER NOT NULL DEFAULT 0`
- Actualizado schema SQLite: `tip_amount INTEGER NOT NULL DEFAULT 0`
- Actualizado repositorio SQLite para incluir tip_amount en INSERT
- Actualizado CheckoutInput en application layer
- Agregado tipAmount al CartState y CartStore (mobile)
- Actualizado useCheckout para pasar tip_amount

**Archivos modificados**:
- `packages/domain/src/entities/order.ts`
- `packages/domain/src/factories.ts`
- `packages/domain/src/test-utils/builders.ts`
- `packages/application/src/use-cases/checkout.ts`
- `packages/application/src/use-cases/add-item-to-cart.ts`
- `packages/db/src/postgres/schema.sql`
- `packages/db/src/schema/sqlite-schema.ts`
- `packages/db/src/sqlite/repositories/order-repository.ts`
- `packages/db/src/__tests__/order-repository.test.ts`
- `apps/mobile/src/store/cart.store.ts`
- `apps/mobile/src/hooks/useCheckout.ts`
- `apps/web/src/test/test-utils/builders.ts`

---

### 2. Página Clientes

**Problema**: No existía módulo para gestionar clientes recurrentes.

**Solución**:
- Creada nueva tabla `customers` en PostgreSQL y SQLite
- Creada página `CustomersPage.tsx` con:
  - Lista de clientes en grid de cards
  - Modal para crear/editar clientes
  - Campos: nombre, teléfono, email, notas
  - Animaciones fade-in
  - Diseño con variables CSS

**Archivos modificados**:
- `packages/db/src/postgres/schema.sql`
- `packages/db/src/schema/sqlite-schema.ts`
- `apps/web/src/pages/CustomersPage.tsx`
- `apps/web/src/App.tsx` (import, NAV, Routes)

---

### 3. Citas con Barbero

**Problema**: Las citas no mostraban qué barbero atendía.

**Solución**:
- Agregados campos a appointments:
  - `barber_id` (UUID, FK a users)
  - `customer_phone` (TEXT)
  - `duration_minutes` (INTEGER)
- Actualizada AppointmentsPage para:
  - Cargar barberos (role = 'barber')
  - Mostrar nombre del barbero en cada cita
  - Selector de barbero en modal de crear cita
  - Cambios de nombres de campos (client_name → customer_name, scheduled_at → start_time)

**Archivos modificados**:
- `packages/db/src/postgres/schema.sql`
- `packages/db/src/schema/sqlite-schema.ts`
- `apps/web/src/pages/AppointmentsPage.tsx`

---

### 4. Dashboard de Rendimiento por Barbero

**Problema**: No había forma de ver estadísticas individuales por barbero.

**Solución**:
- Agregada sección "Rendimiento de Barberos" en AnalyticsPage:
  - Selector dropdown de barberos
  - Statscards mostrando:
    - Ventas totales (últimos 30 días)
    - Propinas totales
    - Número de órdenes
    - Ticket promedio
    - Comisión estimada (calculada con rate de tenant_members o 40% default)
  - Filtrado por barbero específico

**Archivos modificados**:
- `apps/web/src/pages/AnalyticsPage.tsx`

---

## Fase 2: UI/UX (Campos de Servicio y Comisiones)

### 5. Duración en Servicios (Inventario)

**Problema**: Los servicios no tenían campo de duración, dificultando el agendamiento.

**Solución**:
- Campo `duration_minutes` agregado a `CreateItemInput` y `UpdateItemInput`
- UI en `ItemModal`: campo "Duración (min)" visible solo para tipo "Servicio"
- Auto-completado de duración al seleccionar servicio en citas
- Columna de duración en `InventoryTable` cuando todos los items son servicios

**Archivos modificados**:
- `packages/application/src/use-cases/manage-catalog.ts`
- `apps/web/src/hooks/useCatalog.ts`
- `apps/web/src/components/catalog/ItemModal.tsx`
- `apps/web/src/components/inventory/InventoryTable.tsx`

---

### 6. Selector de Cliente en Citas

**Problema**: No había forma de seleccionar un cliente registrado al agendar cita.

**Solución**:
- Dropdown "Cliente registrado" en modal de crear cita
- Opción "Nuevo cliente / Walk-in" por defecto
- Al seleccionar cliente existente, autocompleta nombre y teléfono
- Guarda `customer_id` en la cita para trazabilidad

**Archivos modificados**:
- `apps/web/src/pages/AppointmentsPage.tsx`

---

### 7. Reportes de Comisiones en Dashboard

**Problema**: Los barberos no podían ver sus comisiones estimadas.

**Solución**:
- Consulta `tenant_members` para obtener `commission_rate`
- Default del 40% si no hay tasa configurada
- Statscard "Comisión Est." en color rosa

**Archivos modificados**:
- `apps/web/src/pages/AnalyticsPage.tsx`

---

## Fase 3: Refinamiento

### 8. Indicador Visual Cliente Registrado vs Walk-in

**Problema**: No había forma de distinguir clientes registrados de walk-ins en la UI.

**Solución**:
- Badge "👤" junto al nombre en citas y órdenes cuando `customer_id` existe
- Nueva columna "Cliente" en `OrdersTable` mostrando el badge si aplica

**Archivos modificados**:
- `apps/web/src/pages/AppointmentsPage.tsx`
- `apps/web/src/components/orders/OrdersTable.tsx`

---

### 9. Prevención de Solapamiento en Citas

**Problema**: Un barbero podía tener dos citas al mismo tiempo.

**Solución**:
- Función `hasOverlap()` que verifica horario vs citas existentes del barbero
- Validación antes de crear cita: muestra alert si hay conflicto
- Considera duración de ambas citas para calcular overlaps

**Archivos modificados**:
- `apps/web/src/pages/AppointmentsPage.tsx`

---

### 10. Soporte customer_id en Checkout Mobile

**Problema**: El carrito no permitía vincular un cliente registrado a la orden.

**Solución**:
- `customer_id` agregado a `CartState` y `CartStore`
- `setCustomerId()` en el store
- `CheckoutInput` ahora acepta `customer_id`
- `customer_id` propagado a la orden creada

**Archivos modificados**:
- `packages/application/src/use-cases/add-item-to-cart.ts`
- `packages/application/src/use-cases/checkout.ts`
- `apps/mobile/src/store/cart.store.ts`

---

## Consecuencias

### Positivas
- **Escalabilidad**: El modelo de datos ahora es robusto y puede escalar no solo para barberías, sino para Spas, Salones de Belleza o Clínicas, donde operan dinámicas de citas y profesionales por comisión.
- **Cierres Precisos**: La separación de propinas y comisiones facilitará enormemente la creación de reportes financieros al final del mes.

### Negativas
- **Deuda Técnica Menor**: En algunas tablas aún conservamos el campo de texto `customer_name` como medida de "seguridad / compatibilidad retroactiva" (para "Walk-ins" rápidos que no quieren dejar sus datos). Esto exige que el frontend maneje la lógica de priorizar `customer_id` pero tener un fallback a `customer_name`.

---

## Typecheck

Todas las fases completadas:
- **Fase 1 (Schema)**: 14/14 successful ✅
- **Fase 2 (UI/UX)**: 14/14 successful ✅
- **Fase 3 (Refinamiento)**: 14/14 successful ✅

---

## Resumen de Archivos Modificados por Fase

| Fase | Archivos |
|------|----------|
| **Schema** | `packages/db/src/postgres/schema.sql`, `packages/db/src/schema/sqlite-schema.ts`, `packages/sync/src/powersync-schema.ts`, `packages/domain/src/entities/*.ts`, `packages/domain/src/factories.ts`, `packages/application/src/ports/*.ts` |
| **UI/UX** | `packages/application/src/use-cases/manage-catalog.ts`, `packages/application/src/use-cases/checkout.ts`, `apps/web/src/pages/AppointmentsPage.tsx`, `apps/web/src/pages/AnalyticsPage.tsx`, `apps/web/src/hooks/useCatalog.ts`, `apps/web/src/components/catalog/ItemModal.tsx`, `apps/web/src/components/inventory/InventoryTable.tsx` |
| **Refinamiento** | `apps/web/src/components/orders/OrdersTable.tsx`, `apps/mobile/src/store/cart.store.ts`, `packages/application/src/use-cases/add-item-to-cart.ts` |

---

## Referencias

- ADR-0031: Plan de Optimización para Barbería
- Schema PostgreSQL: `packages/db/src/postgres/schema.sql`
- Schema SQLite: `packages/db/src/schema/sqlite-schema.ts`
- PowerSync Schema: `packages/sync/src/powersync-schema.ts`
- Domain Entities: `packages/domain/src/entities/`
- Application Use Cases: `packages/application/src/use-cases/`