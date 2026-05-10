# Plan de Implementacion — Nuevos Features Dashboard Web

**Fecha:** 2026-05-03 | **Proyecto:** SaaS POS | **Target:** `apps/web`

---

## 1. Contexto y Objetivo

El dashboard web (`apps/web`) es el panel administrativo del dueno de negocio. Actualmente soporta: login, catalogo CRUD, ordenes, analytics con Recharts, gestion de tenants e inventario. Sin embargo, existen brechas operativas criticas que impiden una administracion completa desde la web.

**Objetivo de este plan:** Implementar features que permitan al dueno gestionar su negocio end-to-end desde el navegador, sin depender del movil para operaciones administrativas.

**Principios rectores:**
- Respetar Clean Architecture: logica de negocio en `packages/application`, no en componentes.
- Reutilizar `@saas-pos/ui` (tokens, componentes cross-platform).
- Todo feature es multi-tenant (`tenant_id` en cada query, RLS en backend).
- Tests con Vitest + mocks (sin conexion real a Supabase).
- `turbo run typecheck` y `turbo run build` deben pasar antes de considerar una fase completa.

---

## 2. Resumen de Fases

| Fase | Nombre | Duracion Estimada | # Features | Estado |
|------|--------|-------------------|------------|--------|
| 1 | Core Admin | 1-2 semanas | 4 | Pendiente |
| 2 | Operaciones Avanzadas | 2-3 semanas | 4 | No iniciada |
| 3 | Modulos por Industria | 3-4 semanas | 3 | No iniciada |

---

## 3. Fase 1 — Core Admin

**Meta:** Proveer al dueno las herramientas basicas de administracion que actualmente faltan: exportar datos, gestionar empleados, ver su suscripcion y consultar detalle de ordenes.

### 3.1 Feature 1.1 — Export CSV en Analytics

**Descripcion:** Boton "Exportar CSV" en la pagina de Analytics que descargue dos archivos: `daily_sales.csv` y `top_items.csv`.

**Archivos a modificar/crear:**
- `apps/web/src/pages/AnalyticsPage.tsx` — agregar boton y handler
- `apps/web/src/utils/csv-export.ts` (nuevo) — helper de generacion CSV

**Criterios de aceptacion:**
- [x] Boton visible solo cuando hay datos cargados.
- [x] CSV incluye headers y todas las filas del rango actual (default 30 dias).
- [x] Nombre de archivo incluye fecha y tenant: `analytics_2026-05-03_tenant-abc.csv`.
- [x] No bloquea la UI durante la descarga (usa blob + anchor click).

---

### 3.2 Feature 1.2 — Gestion de Empleados (Users)

**Descripcion:** Pagina para listar, crear, editar roles y desactivar empleados del tenant. Los roles son: `admin`, `cashier`, `waiter`.

**Archivos a modificar/crear:**
- `apps/web/src/pages/UsersPage.tsx` (nuevo)
- `apps/web/src/App.tsx` — agregar ruta `/users`
- `packages/db/src/postgres/repositories/user-repository.ts` (nuevo) — implementar `IUserRepositoryPort`
- `packages/application/src/ports/user-repository.port.ts` (nuevo) — contrato
- `packages/application/src/use-cases/manage-users.ts` (nuevo) — use case CRUD

**Criterios de aceptacion:**
- [x] Lista paginada de usuarios del tenant actual.
- [x] Crear usuario con email, rol inicial. Invitacion via Supabase Auth (genera link de magic link).
- [x] Editar rol de usuario existente.
- [x] Soft delete (marcar `deleted_at`). No eliminar fisicamente.
- [x] Filtro por rol.
- [ ] Solo `admin` puede acceder a esta pagina (verificar `role` en JWT).

---

### 3.3 Feature 1.3 — Configuracion de Suscripcion del Tenant

**Descripcion:** Pagina donde el dueno ve el estado de su suscripcion: plan activo, fecha de expiracion, dias restantes, modulos habilitados.

**Archivos a modificar/crear:**
- `apps/web/src/pages/SubscriptionPage.tsx` (nuevo)
- `apps/web/src/App.tsx` — agregar ruta `/subscription`
- `apps/web/src/hooks/useSubscription.ts` (nuevo) — hook para leer datos del tenant

**Criterios de aceptacion:**
- [x] Muestra `valid_until`, `currency`, `modules_config`.
- [x] Indicador visual de estado: verde (activo), amarillo (expira en < 7 dias), rojo (expirado).
- [x] Lista de modulos activos con iconos/checkmarks.
- [x] Boton "Renovar" (placeholder que abre modal con instrucciones de pago manual: Yape/Plin/transferencia).

---

### 3.4 Feature 1.4 — Vista de Detalle de Orden en Web

**Descripcion:** Al hacer click en una orden del listado, mostrar un drawer/modal con el detalle completo: lineas de producto, cajero, fecha, total, estado actual.

**Archivos a modificar/crear:**
- `apps/web/src/components/OrderDetailDrawer.tsx` (nuevo)
- `apps/web/src/pages/OrdersPage.tsx` — integrar drawer

**Criterios de aceptacion:**
- [x] Drawer lateral (o modal centrado) con animacion de entrada.
- [x] Muestra: ID de orden, fecha, cajero (`user_id` truncado), cliente (`customer_name`), estado con badge de color.
- [x] Tabla de lineas: producto, cantidad, precio unitario, subtotal.
- [x] Total general al pie.
- [x] Boton "Cerrar" y backdrop click para dismiss.

---

### 3.5 Checklist de cierre Fase 1

- [x] `turbo run typecheck` sin errores en `apps/web` y paquetes modificados.
- [x] `turbo run build` exitoso end-to-end.
- [ ] Tests en Vitest para `csv-export.ts`, `manage-users.ts` (con mocks), `useSubscription.ts`.
- [x] Rutas nuevas protegidas por `AuthGuard`.
- [ ] Revision de que no se usen hex literals (usar `@saas-pos/ui` tokens).

---

## 4. Fase 2 — Operaciones Avanzadas

**Meta:** Potenciar la operacion diaria con reembolsos, cierre de caja, alertas de stock y configuracion de metodos de pago.

### 4.1 Feature 2.1 — Reembolso/Anulacion de Ordenes desde Web

**Descripcion:** En el detalle de orden, botones para cambiar el estado a `refunded` o `voided`, validando las transiciones permitidas por la maquina de estados.

**Archivos a modificar/crear:**
- `apps/web/src/components/OrderDetailDrawer.tsx` — agregar acciones
- `apps/web/src/hooks/useOrderStatus.ts` (nuevo) — hook para mutar estado
- `packages/application/src/use-cases/refund-order.ts` (nuevo) — valida transicion y ejecuta

**Criterios de aceptacion:**
- [x] Boton "Anular" visible solo si estado es `pending` → transicion a `cancelled`.
- [x] Boton "Reembolsar" visible solo si estado es `paid` → transicion a `refunded`.
- [x] Confirmacion modal antes de ejecutar.
- [x] Usa `isValidOrderTransition()` del domain.
- [x] Actualiza UI optimista o re-fetch tras exito.

---

### 4.2 Feature 2.2 — Cierre de Caja Diario

**Descripcion:** Pagina de resumen del dia: total ventas, numero de ordenes, desglose por tipo (producto/servicio), desglose por cajero. Exportable a CSV.

**Archivos a modificar/crear:**
- `apps/web/src/pages/CashClosingPage.tsx` (nuevo)
- `apps/web/src/App.tsx` — ruta `/cash-closing`
- Supabase RPC `get_daily_closing(date DATE, tenant_id UUID)` — funcion Postgres nueva
- `packages/db/src/postgres/repositories/order-repository.ts` — expone metodo `getDailyClosing()`

**Criterios de aceptacion:**
- [x] Selector de fecha (default: hoy).
- [x] Cards: Total vendido, # ordenes, ticket promedio.
- [x] Tabla de desglose por cajero (user, # ordenes, total).
- [x] Tabla de desglose por tipo (productos vs servicios).
- [x] Boton "Exportar CSV del dia".
- [x] Mensaje "Sin ventas" si no hay ordenes.

---

### 4.3 Feature 2.3 — Alertas de Stock Bajo

**Descripcion:** Seccion en Inventario (o pagina dedicada) que liste productos con stock por debajo de un umbral configurable.

**Archivos a modificar/crear:**
- `apps/web/src/pages/InventoryPage.tsx` — agregar seccion "Alertas de stock"
- Opcional: `apps/web/src/pages/StockAlertsPage.tsx` (nuevo) si se prefiere pagina separada
- Supabase RPC o query directa: items WHERE `stock < threshold`
- `packages/db/src/postgres/repositories/item-repository.ts` — agregar `findLowStock(threshold)`

**Criterios de aceptacion:**
- [x] Lista de items con stock bajo, ordenados por stock ascendente.
- [ ] Umbral configurable por item (nueva columna opcional `stock_alert_threshold` en tabla `items`).
- [x] Indicador visual: rojo si stock = 0, naranja si stock < threshold, verde si ok.
- [x] Boton "Reabastecer" que abre modal para aumentar stock (reutiliza logica de InventoryPage).

---

### 4.4 Feature 2.4 — Configuracion de Metodos de Pago

**Descripcion:** Pagina para que el dueno configure que metodos de pago acepta: efectivo, Yape, Plin, tarjeta, transferencia.

**Archivos a modificar/crear:**
- Nueva tabla `payment_methods` en PostgreSQL (tenant-scoped): `id`, `tenant_id`, `name`, `type`, `is_active`, `config JSONB`, `created_at`, `updated_at`.
- Migracion Supabase para tabla + RLS.
- `packages/sync/src/powersync-schema.ts` — agregar tabla `payment_methods`.
- `packages/sync/powersync.yaml` — agregar `payment_methods` al bucket `tenant_data`.
- `apps/web/src/pages/PaymentMethodsPage.tsx` (nuevo)
- `packages/db/src/postgres/repositories/payment-method-repository.ts` (nuevo)
- `packages/application/src/use-cases/manage-payment-methods.ts` (nuevo)

**Criterios de aceptacion:**
- [x] Lista de metodos de pago con toggle on/off.
- [x] Agregar metodo personalizado (nombre, tipo).
- [ ] Los metodos activos se sincronizan al movil via PowerSync.
- [ ] En el movil, el checkout debe poder leer metodos activos desde SQLite (preparacion para fase movil futura).
- [ ] RLS: solo usuarios del tenant pueden leer/escribir sus metodos.

---

### 4.5 Checklist de cierre Fase 2

- [ ] Todas las nuevas tablas tienen RLS y estan en PowerSync schema.
- [x] `turbo run typecheck` y `turbo run build` pasan.
- [ ] Tests para `refund-order.ts`, `manage-payment-methods.ts`.
- [ ] Documentacion de nuevas RPCs en `SUPABASE_GUIDE.md` si aplica.

---

## 5. Fase 3 — Modulos por Industria

**Meta:** Activar las tablas modulares (`tables_restaurant`, `appointments`) con UI condicional segun `modules_config` del tenant.

### 5.1 Feature 3.1 — Gestion de Mesas (Restaurante)

**Descripcion:** Pagina de mapa de mesas. Visible solo si `modules_config.has_tables === true`.

**Archivos a modificar/crear:**
- `apps/web/src/pages/TablesPage.tsx` (nuevo)
- `apps/web/src/App.tsx` — ruta `/tables` (condicional o siempre visible pero con empty state)
- `packages/db/src/postgres/repositories/table-repository.ts` (nuevo)
- `packages/application/src/use-cases/manage-tables.ts` (nuevo)

**Criterios de aceptacion:**
- [ ] Grid visual de mesas (tarjetas o layout tipo plano).
- [ ] Estados: `free` (verde), `occupied` (rojo).
- [ ] Crear mesa (numero).
- [ ] Asociar orden activa a una mesa ocupada.
- [ ] Liberar mesa (al cerrar cuenta).
- [ ] Empty state informativo si el tenant no tiene modulo de mesas habilitado.

---

### 5.2 Feature 3.2 — Gestion de Citas (Barberia)

**Descripcion:** Calendario semanal de citas. Visible solo si `modules_config.has_appointments === true`.

**Archivos a modificar/crear:**
- `apps/web/src/pages/AppointmentsPage.tsx` (nuevo)
- `apps/web/src/App.tsx` — ruta `/appointments`
- `packages/db/src/postgres/repositories/appointment-repository.ts` (nuevo)
- `packages/application/src/use-cases/manage-appointments.ts` (nuevo)

**Criterios de aceptacion:**
- [ ] Vista semanal con slots de hora.
- [ ] Crear cita: cliente, servicio (item), fecha/hora.
- [ ] Estados: `scheduled`, `done`, `cancelled`.
- [ ] Validar que no haya superposicion de citas para el mismo servicio/hora.
- [ ] Marcar cita como completada (genera orden automaticamente — opcional, puede dejarse para version futura).

---

### 5.3 Feature 3.3 — Dashboard Configurable por Industria

**Descripcion:** El overview (`/`) se adapta segun `industry_type`: restaurante muestra mesas ocupadas, barberia muestra citas del dia, retail muestra stock critico.

**Archivos a modificar/crear:**
- `apps/web/src/pages/OverviewPage.tsx` (nuevo, o refactor de pagina existente si ya hay una)
- `apps/web/src/components/widgets/TablesWidget.tsx` (nuevo)
- `apps/web/src/components/widgets/AppointmentsWidget.tsx` (nuevo)
- `apps/web/src/components/widgets/StockWidget.tsx` (nuevo)

**Criterios de aceptacion:**
- [ ] Detecta `industry_type` del tenant actual.
- [ ] Renderiza widgets condicionales:
  - `restaurant` → mesas libres/ocupadas, ordenes activas por mesa.
  - `barbershop` → citas de hoy, proximas citas, servicios mas reservados.
  - `retail` → stock critico, ventas del dia, productos mas vendidos.
- [ ] Layout responsive (grid 1-col en movil, 2-3 cols en desktop).

---

### 5.4 Checklist de cierre Fase 3

- [ ] `modules_config` se lee correctamente y filtra la navegacion/visibilidad.
- [ ] Features modulares no crashean si el tenant no tiene el modulo activo (graceful degradation).
- [ ] `turbo run typecheck` y `turbo run build` pasan.
- [ ] Tests para `manage-tables.ts`, `manage-appointments.ts`.

---

## 6. Cambios Transversales por Fase

| Cambio | Aplica a | Descripcion |
|--------|----------|-------------|
| **Router** | Todas | `App.tsx` — agregar rutas nuevas con `react-router-dom` v7. |
| **AuthGuard** | Todas | Verificar sesion activa antes de renderizar cualquier pagina nueva. |
| **Sidebar/Nav** | Todas | Agregar links a nuevas paginas en la navegacion principal del web app. |
| **RLS** | Fase 2+ | Politicas RLS para nuevas tablas (`payment_methods`). |
| **PowerSync Schema** | Fase 2+ | Agregar tablas a `powersync-schema.ts` y `powersync.yaml`. |
| **Tests** | Todas | Vitest en `apps/web/src/__tests__/` + Jest en `packages/*` para use cases nuevos. |
| **UI Tokens** | Todas | Usar `@saas-pos/ui` (colors, spacing, typography). Migrar AnalyticsPage de inline styles a Tailwind (deuda UX-009). |
| **ErrorBoundary** | Todas | Cada pagina nueva envuelta en `ErrorBoundary`. |

---

## 7. Testing Strategy

### 7.1 Por capa

| Capa | Que testar | Runner | Ubicacion |
|------|-----------|--------|-----------|
| `domain` | Nuevas reglas (si emergen) | Jest | `packages/domain/src/__tests__/` |
| `application` | Use cases nuevos con repos mock | Jest | `packages/application/src/__tests__/` |
| `db` | Nuevos metodos de repos con DB mock | Jest | `packages/db/src/__tests__/` |
| `web` | Hooks de paginas, helpers (CSV), componentes | Vitest | `apps/web/src/__tests__/` |

### 7.2 Tests obligatorios por fase

**Fase 1:**
- `csv-export.ts`: genera blob correcto, headers presentes, datos mapeados.
- `manage-users.ts`: crear usuario, editar rol, soft delete, filtro por rol.
- `useSubscription.ts`: calcula dias restantes correctamente, detecta expirado.

**Fase 2:**
- `refund-order.ts`: valida transiciones legales, rechaza transiciones ilegales.
- `manage-payment-methods.ts`: toggle activo/inactivo, agregar metodo.
- `get_daily_closing` RPC: agregaciones correctas por fecha/tenant.

**Fase 3:**
- `manage-tables.ts`: crear mesa, ocupar/liberar.
- `manage-appointments.ts`: crear cita, validar superposicion.

---

## 8. Criterios de Aceptacion Globales

1. **Multi-tenancy:** Todo query filtra por `tenant_id`. RLS es la ultima linea de defensa, no la unica.
2. **Design system:** No hex literals. Usar tokens de `@saas-pos/ui`.
3. **Type safety:** Sin `any`. TypeScript estricto.
4. **Error handling:** ErrorBoundary en toda pantalla. Estados de error, loading, empty.
5. **Responsive:** Web app usable en tablet (1024px) y desktop (1440px). Mobile web (375px) es nice-to-have.
6. **Performance:** Paginas cargan en < 1s (sin contar red). Listas con paginacion.
7. **Build:** `turbo run typecheck` + `turbo run test` + `turbo run build` pasan sin errores antes de merge.

---

## 9. Notas y Riesgos

| Riesgo | Mitigacion |
|--------|------------|
| Cambios en `packages/domain` impactan todo el monorepo | PR separado para cambios de domain. Revisar dependencias con `turbo run typecheck`. |
| Nuevas tablas en PostgreSQL requieren migraciones | Usar migraciones aditivas (nunca DROP). Documentar en `SUPABASE_GUIDE.md`. |
| PowerSync schema changes requieren sync de dispositivos | Agregar campos de forma aditiva. Versionar schema si es necesario. |
| Roles de usuario (admin vs cashier) no estan validados en web | Implementar guard simple en `AuthGuard` o wrapper de pagina. No reemplazar RLS. |
| AnalyticsPage usa inline styles (UX-009) | Migrar a Tailwind como parte de Fase 1 (prerrequisito de consistencia visual). |

---

## 10. Estado del Plan

| Fase | Estado | Fecha inicio | Fecha fin |
|------|--------|--------------|-----------|
| Fase 1 — Core Admin | Pendiente | — | — |
| Fase 2 — Operaciones Avanzadas | No iniciada | — | — |
| Fase 3 — Modulos por Industria | No iniciada | — | — |

---

*Generado por auditoria integral — Mayo 2026.*
*Fuentes: ALCANCES_Y_REQUERIMIENTOS.md, AUDIT.md, AI_RULES.md, codigo fuente de apps/web y packages/.*
