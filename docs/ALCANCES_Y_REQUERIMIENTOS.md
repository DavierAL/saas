# Alcances y Requerimientos Actuales — SaaS POS

**Fecha:** 2026-05-03 | **Branch:** `main` | **Stack:** React Native + Expo · React + Vite · Supabase + PowerSync · Turborepo

---

## 1. Visión del Producto

**SaaS POS** es un sistema de Punto de Venta (POS) **Multi-Tenant, Modular y Local-First** orientado al mercado peruano. Está dirigido a pequeños comercios — abarrotes, restaurantes y barberías — y garantiza disponibilidad absoluta al no requerir internet constante para operar la caja registradora.

### Propuesta de valor

- **Offline-First:** El cajero siempre lee/escribe contra SQLite local (latencia 0ms). La nube (PostgreSQL) es una réplica asíncrona vía PowerSync.
- **Multi-Tenant con aislamiento real:** Cada tabla está particionada por `tenant_id`. Supabase Row-Level Security (RLS) impone aislamiento matemático a nivel de base de datos.
- **Modularidad por Feature Flags:** Un solo APK. La UI se adapta según `modules_config` (JSON) del tenant: muestra/oculta inventario, mesas, citas.
- **Paywall Offline:** La app valida `valid_until` contra la fecha local del dispositivo. Sin internet no hay bypass del paywall.

### Mercado objetivo

- Geografía: Perú (moneda por defecto: PEN).
- Segmentos: abarrotes/bodegas (`retail`), restaurantes (`restaurant`), barberías/peluquerías (`barbershop`).
- Canales de pago esperados: efectivo, Yape, Plin, transferencia.

---

## 2. Alcance Actual — Lo Implementado

### 2.1 Aplicación Móvil (`apps/mobile`) — React Native + Expo

| Funcionalidad | Estado | Detalle |
|---|---|---|
| Autenticación (login/register) | Implementado | Supabase Auth con email/password. Pantallas en `(auth)/login.tsx`, `register.tsx` |
| Onboarding post-registro | Implementado | Selección de tipo de negocio en `(auth)/onboarding.tsx` |
| Navegación por tabs | Implementado | Catálogo, Carrito, Órdenes. expo-router con `(tabs)/_layout.tsx` |
| Catálogo de productos/servicios | Implementado | FlashList con skeleton loading, búsqueda, filtro por tipo. `(tabs)/index.tsx` |
| Carrito de compras | Implementado | Zustand store (`cart.store.ts`), add/remove items, total en tiempo real. `(tabs)/cart.tsx` |
| Checkout (crear orden) | Implementado | Use case `checkout.ts` con: validación suscripción → validación stock → transacción atómica SQLite (order + lines + decremento stock). `useCheckout.ts` |
| Listado de órdenes | Implementado | Paginación cursor-based, búsqueda local, filtro por día. `(tabs)/orders.tsx` |
| Detalle de orden | Implementado | `order-detail.tsx` con líneas, total, estado. Placeholder para "Print Receipt" y "Refund" |
| Paywall / bloqueo por suscripción | Implementado | Validación offline (`validate-subscription.ts`) + remota (`remote-validate-subscription.ts` vía Supabase Edge Function). `paywall.tsx` |
| Sincronización offline→online | Implementado | PowerSyncDatabase con Supabase connector. `powersync/database.ts` |
| Indicador de sync status | Parcial | `useSyncStatus.ts` + `SyncBadge`. Sin banner offline global |
| Error Boundary | Parcial | `ErrorBoundary.tsx` en pantallas. Sin cobertura completa |
| Loading / Skeleton states | Implementado | `LoadingScreen.tsx`, `Skeleton.tsx` en catálogo y órdenes |

### 2.2 Dashboard Web (`apps/web`) — React + Vite

| Funcionalidad | Estado | Detalle |
|---|---|---|
| Autenticación (login/register) | Implementado | `LoginPage.tsx`, `RegisterPage.tsx` |
| AuthGuard (ruta protegida) | Implementado | `AuthGuard.tsx` con verificación de sesión Supabase |
| Dashboard / Overview | Implementado | `OverviewPage` (ruta `/`) |
| Catálogo (gestión de items) | Implementado | `CatalogPage.tsx` — CRUD de productos/servicios |
| Inventario | Implementado | `InventoryPage.tsx` — vista y ajuste de stock |
| Órdenes | Implementado | `OrdersPage.tsx` — listado de ventas |
| Analytics | Implementado | `AnalyticsPage.tsx` con Recharts (LineChart, BarChart, PieChart). Datos vía Supabase RPC `get_sales_analytics` |
| Gestión de tenants | Implementado | `TenantsPage.tsx` — administración multi-tenant |
| Error Boundary | Parcial | `ErrorBoundary.tsx`. Sin cobertura completa |

### 2.3 Backend / Infraestructura

| Componente | Estado | Detalle |
|---|---|---|
| Supabase Auth | Configurado | JWT con `custom_access_token_hook` que extrae `tenant_id` al root claim |
| Supabase PostgreSQL | Configurado | 7 tablas con RLS por `tenant_id` |
| Supabase Edge Function | Desplegada | `validate-subscription/` — Deno function para validación remota de suscripción |
| PowerSync (self-hosted) | Configurado | Bucket `tenant_data` parametrizado por `request.jwt() ->> 'tenant_id'` |
| RPC functions (Postgres) | Implementadas | `create_order_with_lines`, `decrement_item_stock`, `get_sales_analytics` |
| Migraciones DB | Parcial | Un solo archivo de migración (`auth_hook.sql`). Sin sistema de versionado formal |

### 2.4 Lógica de Dominio (`packages/`)

| Capa | Alcance | Archivos clave |
|---|---|---|
| **domain** | 5 entidades, 2 value objects, 3 reglas de negocio, errores, factories | `entities/` (Item, Order, OrderLine, Tenant, User), `value-objects/` (Money, Quantity), `rules/` (pricing, subscription, inventory) |
| **application** | 5 use cases, 4 ports | `checkout.ts`, `add-item-to-cart.ts`, `validate-subscription.ts`, `remote-validate-subscription.ts`, `manage-catalog.ts` |
| **db** | 6 repositorios (3 SQLite + 3 Postgres), schema SQLite, migration runner | `sqlite/repositories/`, `postgres/repositories/`, `schema/sqlite-schema.ts` |
| **sync** | Schema PowerSync (7 tablas), config buckets | `powersync-schema.ts`, `powersync.yaml` |
| **ui** | Tokens de diseño + 4 componentes cross-platform | `tokens.ts`, `components/` (Button, Badge, StatusDot, Input) |
| **utils** | ID generation, date utils, logger | `id.ts`, `date.ts`, `logger.ts` |

---

## 3. Arquitectura y Stack Tecnológico

### 3.1 Diagrama de dependencias (Hexagonal / Clean Architecture)

```
apps/mobile ──┐
apps/web    ──┼──▶ packages/db ──▶ packages/application ──▶ packages/domain
               │        │
               └────────┴──▶ packages/ui | packages/utils | packages/sync
```

- `domain`: **Cero dependencias externas.** Solo TypeScript estándar.
- `application`: Solo importa de `domain` y `utils`. Nunca de `db` ni `ui`.
- `db`: Implementa los ports de `application`. Única capa que toca PowerSync/Supabase.
- `apps`: Consumidores finales. Instancian use cases con implementaciones concretas de `db`.

### 3.2 Stack completo

| Capa | Tecnología | Versión |
|---|---|---|
| Monorepo | Turborepo + npm workspaces | latest |
| Lenguaje | TypeScript | 5.7–5.9 |
| Mobile App | React Native + Expo SDK | 54 / RN 0.81.5 |
| Mobile Routing | expo-router (file-based) | v4 |
| Mobile State (efímero) | Zustand | latest |
| Mobile Listas | @shopify/flash-list | latest |
| Web App | React + Vite | 18.3 / 6.x |
| Web Routing | react-router-dom | v7 |
| Web Charts | Recharts | 2.15 |
| Auth | Supabase Auth (JWT) | @supabase/supabase-js |
| Cloud DB | Supabase PostgreSQL + RLS | latest |
| Local DB | SQLite (via @journeyapps/react-native-quick-sqlite) | — |
| Sync Engine | PowerSync (self-hosted) | @powersync/react-native |
| Monitoring | Sentry | @sentry/react |
| Testing (packages) | Jest 29 + ts-jest | 29 |
| Testing (apps) | Vitest | 2.1 |

### 3.3 Patrones arquitectónicos implementados

- **Hexagonal / Clean Architecture** — Separación estricta dominio ↔ aplicación ↔ infraestructura ↔ UI.
- **Repository Pattern** — Interfaces en `application/ports/`, implementaciones en `db/`.
- **Ports & Adapters** — `IOrderRepositoryPort`, `IItemRepositoryPort`, `ITenantRepositoryPort`, `IRemoteValidatorPort`.
- **Singleton Pattern** — Clientes Supabase y PowerSyncDatabase como singletons lazy.
- **Factory Pattern** — `createItem()`, `createOrder()`, `createOrderLine()` con validación runtime.
- **Builder Pattern** — `ItemBuilder`, `TenantBuilder`, `OrderBuilder` para tests.
- **State Machine** — `OrderStatus` con 6 estados y transiciones validadas.
- **Single Table Inheritance** — Productos y servicios unificados en tabla `items` con discriminador `type`.
- **Soft Delete** — Campo `deleted_at` en todas las tablas.

---

## 4. Modelo de Datos

### 4.1 Esquema Cloud (PostgreSQL / Supabase)

**7 tablas, todas particionadas por `tenant_id`:**

```
tenants
  id UUID PK, name VARCHAR, industry_type VARCHAR,
  modules_config JSONB, valid_until TIMESTAMP, currency VARCHAR(3),
  last_remote_validation_at TIMESTAMP, created_at, updated_at, deleted_at

users
  id UUID PK, tenant_id UUID FK, email VARCHAR UNIQUE,
  password_hash VARCHAR, role VARCHAR, created_at, updated_at, deleted_at

items
  id UUID PK, tenant_id UUID FK, type VARCHAR (product|service),
  name VARCHAR, price INTEGER (cents), stock INTEGER|null,
  created_at, updated_at, deleted_at

orders
  id UUID PK, tenant_id UUID FK, user_id UUID FK,
  customer_name VARCHAR|null, status VARCHAR (pending|paid|cancelled|refunded|partially_refunded|voided),
  total_amount INTEGER (cents), currency VARCHAR(3), created_at, updated_at, deleted_at

order_lines
  id UUID PK, order_id UUID FK, item_id UUID FK,
  quantity INTEGER, unit_price INTEGER (cents), subtotal INTEGER (cents), tenant_id UUID FK

tables_restaurant
  id UUID PK, tenant_id UUID FK, table_number INTEGER, status VARCHAR

appointments
  id UUID PK, tenant_id UUID FK, customer_name VARCHAR,
  item_id UUID FK, start_time TIMESTAMP, status VARCHAR
```

### 4.2 Reglas de datos críticas

| Regla | Descripción |
|---|---|
| **Dinero en integer cents** | Todo precio, subtotal y total_amount se almacena como entero (centavos). Nunca `FLOAT`/`DECIMAL`. Validado por `Money` value object. |
| **`unit_price` duplicado en `order_lines`** | Foto histórica del precio al momento de la venta. Si el precio del ítem cambia mañana, las ventas pasadas no se alteran. |
| **Normalización 3NF** | Esquema validado contra 1NF, 2NF, 3NF. Sin listas separadas por comas, sin dependencias transitivas. |
| **Soft delete** | `deleted_at` en todas las tablas. Nunca DELETE físico. |
| **`modules_config` como JSONB/string** | PostgreSQL: JSONB. SQLite: TEXT (con try/catch al parsear). |
| **`password_hash` sync** | AI_RULES.md advierte que NO debería sincronizarse a SQLite local (riesgo PII en dispositivos). Actualmente presente en schema PowerSync. |
| **Paginación cursor-based** | `findByTenant` usa cursor, no offset, para listas de órdenes. |

### 4.3 Máquina de estados de órdenes

```
pending ──▶ paid ──▶ refunded
  │                    ▲
  ├──▶ cancelled       │
  └──▶ voided    partially_refunded ──▶ refunded
```

Transiciones válidas definidas en `ORDER_STATUS_TRANSITIONS` (`packages/domain/src/entities/order.ts:21`).

---

## 5. Requerimientos Funcionales

### RF-01: Autenticación y Gestión de Usuarios
- **RF-01.1** Registro de usuario con email/password. → `apps/mobile/app/(auth)/register.tsx`, `apps/web/src/pages/RegisterPage.tsx`
- **RF-01.2** Inicio de sesión con email/password. → `apps/mobile/app/(auth)/login.tsx`, `apps/web/src/pages/LoginPage.tsx`
- **RF-01.3** Onboarding con selección de tipo de negocio. → `apps/mobile/app/(auth)/onboarding.tsx`
- **RF-01.4** El JWT debe incluir `tenant_id` en claims raíz para PowerSync. → `supabase/migrations/20260430000000_auth_hook.sql`
- **RF-01.5** Protección de rutas por sesión (AuthGuard). → `apps/web/src/components/AuthGuard.tsx`, `apps/mobile/src/providers/AppProvider.tsx`

### RF-02: Catálogo de Productos y Servicios
- **RF-02.1** Listar items con paginación eficiente (FlashList). → `apps/mobile/app/(tabs)/index.tsx`
- **RF-02.2** Búsqueda local de items por nombre. → `apps/mobile/app/(tabs)/index.tsx:search`
- **RF-02.3** Filtrar por tipo (producto / servicio). → `useItems.ts`
- **RF-02.4** CRUD completo de items (web). → `apps/web/src/pages/CatalogPage.tsx`, `manage-catalog.ts`
- **RF-02.5** Skeleton loading durante carga. → `apps/mobile/src/components/Skeleton.tsx`

### RF-03: Carrito de Compras
- **RF-03.1** Agregar items al carrito desde catálogo. → `add-item-to-cart.ts`
- **RF-03.2** Incrementar/decrementar cantidad en carrito. → `add-item-to-cart.ts`
- **RF-03.3** Eliminar items del carrito. → `apps/mobile/src/store/cart.store.ts`
- **RF-03.4** Calcular total en tiempo real (con Money arithmetic). → `add-item-to-cart.ts:getCartTotal()`
- **RF-03.5** Estado efímero (no persistido, se pierde al cerrar app). → Zustand store

### RF-04: Checkout y Órdenes
- **RF-04.1** Validar suscripción activa antes del checkout. → `validate-subscription.ts`, `isTenantSubscriptionActive()`
- **RF-04.2** Validar stock disponible antes del checkout. → `inventory.ts`
- **RF-04.3** Crear orden con líneas en transacción atómica. → `checkout.ts` + `insertOrderWithLines()`
- **RF-04.4** Decrementar stock automáticamente dentro de la transacción. → `db/src/sqlite/repositories/order-repository.ts`
- **RF-04.5** Listar órdenes con paginación cursor-based. → `apps/mobile/app/(tabs)/orders.tsx`
- **RF-04.6** Ver detalle de una orden con sus líneas. → `apps/mobile/app/order-detail.tsx`
- **RF-04.7** Búsqueda de órdenes por nombre de cliente. → `apps/mobile/app/(tabs)/orders.tsx`
- **RF-04.8** Gestión de órdenes desde el dashboard web. → `apps/web/src/pages/OrdersPage.tsx`

### RF-05: Sincronización Offline/Online
- **RF-05.1** Lectura/escritura local contra SQLite sin internet. → `powersync/database.ts`
- **RF-05.2** Sincronización bidireccional al recuperar conexión. → PowerSyncDatabase + Supabase connector
- **RF-05.3** Sincronización filtrada por `tenant_id` (JWT). → `powersync.yaml` bucket `tenant_data`
- **RF-05.4** Indicador de estado de sincronización. → `useSyncStatus.ts`

### RF-06: Suscripción y Paywall
- **RF-06.1** Validación offline de suscripción (contra `valid_until` local). → `validate-subscription.ts`
- **RF-06.2** Validación remota de suscripción (contra Supabase Edge Function). → `remote-validate-subscription.ts`
- **RF-06.3** Actualización de `valid_until` local tras validación remota. → `remote-validate-subscription.ts`
- **RF-06.4** Bloqueo de checkout si suscripción expirada. → `paywall.tsx`
- **RF-06.5** Los datos del cliente no se borran al expirar la suscripción.

### RF-07: Analytics (Web Dashboard)
- **RF-07.1** Tendencia de ventas diarias (LineChart). → `AnalyticsPage.tsx`
- **RF-07.2** Items más vendidos (BarChart). → `AnalyticsPage.tsx`
- **RF-07.3** Ingresos por categoría (PieChart). → `AnalyticsPage.tsx`
- **RF-07.4** Datos vía Supabase RPC `get_sales_analytics`. → `order-repository.port.ts:getAnalytics()`
- **RF-07.5** Range de 30 días por defecto.

### RF-08: Multi-Tenant
- **RF-08.1** Aislamiento de datos por `tenant_id` en todas las queries. → RLS en PostgreSQL
- **RF-08.2** `tenant_id` propagado desde JWT claims. → `custom_access_token_hook`
- **RF-08.3** Gestión de tenants desde web dashboard. → `TenantsPage.tsx`
- **RF-08.4** Configuración modular por tenant (`modules_config` JSON). → `tenant.ts:ModulesConfig`

### RF-09: Inventario (Web Dashboard)
- **RF-09.1** Vista de stock actual por item. → `InventoryPage.tsx`
- **RF-09.2** Ajuste manual de stock. → `manage-catalog.ts`

### RF-10: Diseño Multi-Plataforma
- **RF-10.1** Componentes cross-platform en `@saas-pos/ui`. → Button, Badge, StatusDot, Input
- **RF-10.2** Tokens de diseño centralizados (no hex literals). → `tokens.ts`
- **RF-10.3** Dark theme por defecto con 4pt grid.

---

## 6. Requerimientos No Funcionales

### RNF-01: Rendimiento
- **RNF-01.1** Latencia 0ms en operaciones de caja (contra SQLite local, no red).
- **RNF-01.2** Listas con 60fps constantes (FlashList con reciclaje de vistas).
- **RNF-01.3** Transacciones atómicas en checkout (no hay estados intermedios visibles).
- **RNF-01.4** Paginación en todas las listas (nunca cargar datos ilimitados).

### RNF-02: Disponibilidad
- **RNF-02.1** Operación 100% funcional sin internet (offline-first).
- **RNF-02.2** Sincronización automática al recuperar conectividad.
- **RNF-02.3** Sin pérdida de datos: las escrituras offline se encolan y sincronizan.

### RNF-03: Seguridad
- **RNF-03.1** Row-Level Security (RLS) en PostgreSQL para aislamiento multi-tenant.
- **RNF-03.2** Validación de JWT issuer con comparación exacta de hostname (no `includes()`).
- **RNF-03.3** Sin `console.log` de datos sensibles en producción.
- **RNF-03.4** Variables de entorno para todas las URLs y keys. Nunca hardcodeadas.
- **RNF-03.5** `password_hash` no debe sincronizarse a SQLite (⚠ pendiente de corrección).
- **RNF-03.6** Validación de estructura de datos recibidos de Supabase (prevenir datos malformados).

### RNF-04: Mantenibilidad
- **RNF-04.1** Clean Architecture con dependencias unidireccionales.
- **RNF-04.2** TypeScript estricto, sin `any`.
- **RNF-04.3** Convenciones de naming: `camelCase`, `PascalCase`, `UPPER_SNAKE_CASE`, `kebab-case.ts`.
- **RNF-04.4** Archivos ≤ 150 líneas. Si excede, dividir.
- **RNF-04.5** Un PR por fase. Cambios en `domain` siempre en PR separado.

### RNF-05: Testing
- **RNF-05.1** Cobertura mínima: `domain` 50%, `application` 60%, `db` 60%, `utils` 1 test/función.
- **RNF-05.2** Objetivo global: 80% (actual: ~50%).
- **RNF-05.3** Tests unitarios sin conexión a Supabase ni PowerSync (usar mocks/builders).
- **RNF-05.4** `turbo run typecheck` + `turbo run test` + `turbo run build` pasando antes de merge.

### RNF-06: Observabilidad
- **RNF-06.1** Captura de errores con Sentry (stack traces offline → envío al reconectar).
- **RNF-06.2** Logs estructurados en archivo local para debugging de sincronización.

### RNF-07: UX / Accesibilidad
- **RNF-07.1** Touch targets ≥ 44×44pt (Apple HIG).
- **RNF-07.2** Font sizes ≥ 12px para texto legible.
- **RNF-07.3** Safe area insets en dispositivos con notch/home indicator.
- **RNF-07.4** Estados: loading (skeleton shimmer), empty, error, success en toda pantalla.
- **RNF-07.5** ErrorBoundary en toda pantalla nueva.
- **RNF-07.6** Confirmación para acciones destructivas (vaciar carrito).

### RNF-08: DevOps
- **RNF-08.1** Entornos Production y Staging aislados (diferentes App IDs, iconos, DBs).
- **RNF-08.2** EAS Build para APK, EAS Update (OTA) para parches JS/TS.
- **RNF-08.3** Migraciones aditivas (nunca eliminar columnas/tablas). Schema version local con auto-migración.

---

## 7. Brechas y Pendientes

### 7.1 Bugs Críticos Pendientes (del AUDIT.md, Abril 2026)

| ID | Descripción | Severidad |
|---|---|---|
| BUG-001 | `user_id: 'demo-user-id'` hardcodeado en checkout → sin trazabilidad de cajero | Crítico |
| BUG-002 | Pantalla en blanco durante inicialización de DB → sin feedback al usuario | Crítico |
| BUG-003 | `console.log` con tenant ID y datos de ventas en AnalyticsPage web | Crítico (Seguridad) |
| BUG-004 | Validación JWT con `includes()` → bypasseable | Alto (Seguridad) |
| BUG-005 | `loadMore` marca loading=false antes de completar la carga | Alto |
| BUG-006 | Ícono de carrito vacío invisible (mismo color que fondo) | Alto |

### 7.2 Deuda Técnica Pendiente

| ID | Descripción |
|---|---|
| DEBT-001 | Cast `(db as any)` en hooks — silencia incompatibilidad de tipos |
| DEBT-002 | `FlashList as any` en pantallas de catálogo y órdenes |
| DEBT-003 | `children: any` en providers → debe ser `ReactNode` |
| DEBT-004 | `password_hash` incluido en schema PowerSync (riesgo PII) |

### 7.3 Features Planeadas No Implementadas

| ID | Feature | Prioridad |
|---|---|---|
| FEAT-001 | Escaneo de código de barras (expo-camera) | Alta |
| FEAT-002 | Recibo compartible (PDF/imagen vía Share Sheet) | Alta |
| FEAT-003 | Input de cantidad directa en carrito (no solo botones ±1) | Alta |
| FEAT-004 | Nombre de cliente en orden | Alta |
| FEAT-005 | Banner offline global (visible en todas las pantallas) | Alta |
| FEAT-006 | Sistema de descuentos (porcentaje o monto fijo) | Media |
| FEAT-007 | Flujo de devolución/reembolso (estado `refunded` ya en schema) | Media |
| FEAT-008 | Cierre de caja diario (resumen de ventas del día) | Media |
| FEAT-009 | Export CSV en Analytics web | Media |
| FEAT-010 | Gestión de mesas para restaurantes (`tables_restaurant` en schema) | Media |
| FEAT-011 | Notificaciones push (stock bajo) | Baja |
| FEAT-012 | Múltiples métodos de pago (efectivo, tarjeta, transferencia, Yape/Plin) | Baja |

### 7.4 Cobertura de Tests

| Paquete | Estado | Objetivo |
|---|---|---|
| `packages/domain` | ~14 tests (pricing, subscription, inventory) | 50% mín → 80% |
| `packages/application` | ~9 tests (checkout, add-to-cart) | 60% mín → 80% |
| `packages/db` | ~5 tests (order-repository, item, tenant) | 60% mín → 80% |
| `packages/sync` | Dummy test placeholder | 1+ test significativo |
| `packages/ui` | Sin tests | Al menos tests de tokens |
| `packages/utils` | Sin tests | 1 test por función exportada |
| `apps/mobile` | Dummy test placeholder | Tests de hooks principales |
| `apps/web` | Dummy test placeholder | Tests de páginas principales |
| **Global** | **~50%** | **80%** |

### 7.5 UX Debt

| ID | Descripción |
|---|---|
| UX-001 | Íconos de tabs con glifos Unicode (no Ionicons, sin accessibilityLabel) |
| UX-002 | Tab bar sin safe area insets en iOS |
| UX-003 | Touch targets de tabs 32×28px (mínimo 44×44) |
| UX-004 | Skeleton sin animación shimmer |
| UX-005 | Search bars a 40px de alto (mínimo 44px) |
| UX-006 | Retry button sin feedback de press |
| UX-007 | Font sizes < 12px en badges y labels |
| UX-008 | Emojis como íconos estructurales en AnalyticsPage web |
| UX-009 | Inline styles en AnalyticsPage (migrar a Tailwind) |
| UX-010 | Password toggle con posición absoluta hardcodeada |

---

## 8. Decisiones Arquitectónicas (ADR Index)

Los siguientes Architecture Decision Records documentan decisiones clave tomadas durante el desarrollo:

| ADR | Título | Dominio |
|---|---|---|
| 0001 | Implementación de Supabase Auth + PowerSync | Auth / Sync |
| 0002 | Registro de usuarios y onboarding | Auth |
| 0003 | Multi-tenant con metadata real (no hardcodeado) | Multi-tenancy |
| 0005 | Reconciliación de usuario de prueba | Auth / Testing |
| 0006 | Corrección de RLS para Analytics | Seguridad / DB |
| 0007 | Detalle de órdenes | Feature |
| 0008 | Configuración de entorno local (web + Android) | DevOps |
| 0009 | Corrección de sincronización PowerSync | Sync |
| 0010 | PowerSync sync streams skeleton fix | Sync |
| 0011 | PowerSync claims y moneda dinámica | Sync / Dominio |
| 0012 | Migración a nueva arquitectura y FlashList v2 | Arquitectura |
| 0013 | Estabilización y UX polish del POS mobile | UX / Mobile |
| 0014 | Fix PowerSync sync y JWT auth hook | Sync / Auth |
| 0015 | PowerSync S2105 JWT audience resolution | Sync |
| 0016 | Sync pipeline stabilization | Sync |
| 003 | Mobile sync fix | Sync |

---

## 9. Roadmap

Basado en `guia-arquitectonica-y-devOps.md:97-103`:

| Fase | Descripción | Estado |
|---|---|---|
| **Fase 0** | Configuración del monorepo (Turborepo) y plantillas base (Expo / Vite) | Completado |
| **Fase 1** | "Hello World" de sincronización: Supabase + PowerSync + App Móvil | Completado |
| **Fase 2** | Modelado de BD (Catálogo, Órdenes, Tenants) y políticas RLS | Completado |
| **Fase 3** | Construcción de UI (FlashList, Zustand, checkout) | Completado (con gaps) |
| **Pendiente** | Sprint correctivo (bugs críticos + UX debt) | Planificado |
| **Pendiente** | Sprint features prioridad alta (barcode, receipt, qty input, customer name, offline banner) | Planificado |
| **Pendiente** | Features prioridad media (discounts, refunds, cash closing, CSV export, tables, notifications, payment methods) | Backlog |
| **Pendiente** | Cobertura de tests al 80% | Planificado |
| **Pendiente** | Integración de hardware (impresora térmica, lector de código de barras) | Backlog |

---

*Generado por auditoría integral — Mayo 2026.*
*Fuentes: AUDIT.md, AI_RULES.md, bdd.md, guia-arquitectonica-y-devOps.md, docs/project_analysis.md, docs/adr/*, código fuente en packages/ y apps/.*
