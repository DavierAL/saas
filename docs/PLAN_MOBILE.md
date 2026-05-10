# Plan de Implementacion Mobile — SaaS POS

**Fecha:** 2026-05-04 | **Proyecto:** SaaS POS | **Target:** `apps/mobile`
**Stack:** React Native + Expo SDK 54 · Supabase + PowerSync · Turborepo · TypeScript 5.7
**Arquitectura:** Hexagonal / Clean Architecture — `packages/domain` → `packages/application` → `packages/db`

---

## 1. Vision y Principios Rectores

**Vision:** Llevar la app mobile desde su estado actual (funcional pero con gaps criticos) a un **MVP profesional** que un pequeno negocio peruano (abarrote, restaurante o barberia) pueda usar diariamente sin depender de internet. Luego, escalar a un sistema completo con modulos por industria.

**Principios rectores:**
1. **Offline-First absoluto:** Toda feature nueva debe funcionar 100% sin internet. La nube es replica asincrona, nunca bloqueante.
2. **Clean Architecture estricta:** Logica de negocio en `packages/application`, nunca en componentes de pantalla. Un archivo ≤ 150 lineas.
3. **Multi-Tenant en cada capa:** Cada query SQLite filtra por `tenant_id`. Cada UI respeta `modules_config` del tenant.
4. **Calidad antes de velocidad:** `turbo run typecheck` + `turbo run test` + `turbo run build` deben pasar antes de mergear cualquier fase.
5. **Un PR por fase.** Cambios en `packages/domain` siempre en PR separado y primero.

---

## 2. Resumen Ejecutivo de Fases

| Fase | Nombre | Duracion Estimada | # Features / Correcciones | Meta |
|------|--------|-------------------|---------------------------|------|
| 0 | Fundamentos y Correcciones Criticas | 1 semana | 9 bugs + 3 debt + 4 UX | Eliminar todo lo que bloquea o dana la experiencia base. |
| 1 | MVP Core POS | 2 semanas | 5 features + 2 infra | El cajero puede operar un dia completo sin fricciones. |
| 2 | Experiencia Profesional | 2–3 semanas | 5 features + 3 UX | El POS se siente como una herramienta real, no un prototipo. |
| 3 | Modulos por Industria | 3–4 semanas | 2 modulos + 3 features | Un solo APK que se adapta a restaurantes y barberias. |
| 4 | Escalamiento y Polish | 3–4 semanas | 4 features + tests + DevOps | Sistema completo listo para crecer y monetizar. |

**Total estimado:** 11–14 semanas (3–3.5 meses) para MVP completo con modulos por industria.

---

## 3. Fase 0 — Fundamentos y Correcciones Criticas

**Meta:** Eliminar bugs que bloquean, corregir deuda tecnica que silencia errores, y pulir UX basica. Sin esto, no hay MVP confiable. Todas las correcciones son obligatorias antes de avanzar a Fase 1.

**Duracion:** 1 semana (1 sprint)  
**Dependencias:** Ninguna.

### 3.1 Bugs Criticos (del AUDIT.md)

| ID | Descripcion | Archivos a modificar | Severidad |
|---|---|---|---|
| **BUG-001** | `user_id: 'demo-user-id'` hardcodeado en checkout. Sin trazabilidad de cajero. | `apps/mobile/src/hooks/useCheckout.ts:39` | Critico |
| **BUG-002** | Pantalla en blanco mientras DB inicializa. Sin feedback ni manejo de error. | `apps/mobile/src/providers/AppProvider.tsx:144-146` | Critico |
| **BUG-003** | `console.log` expone `tenantId` y datos de analytics en web. | `apps/web/src/pages/AnalyticsPage.tsx:59,62` | Critico (Seguridad) |
| **BUG-004** | Validacion JWT con `includes()` es bypasseable. | `apps/mobile/src/providers/AppProvider.tsx:57` | Alto (Seguridad) |
| **BUG-005** | `loadMore` marca `loading=false` antes de completar carga. | `apps/mobile/app/(tabs)/orders.tsx:139-148` | Alto |
| **BUG-006** | Icono de carrito vacio invisible (mismo color que fondo). | `apps/mobile/app/(tabs)/cart.tsx:63,126` | Alto |
| **BUG-007** | Vaciar carrito sin confirmacion (destructivo accidental). | `apps/mobile/app/(tabs)/cart.tsx:94` | Medio |

**Criterios de aceptacion globales para Fase 0:**
- [ ] Ningun `user_id` hardcodeado en produccion.
- [ ] Pantalla de carga visible durante init de DB + mensaje de error si falla.
- [ ] Ningun `console.log` con datos sensibles en `apps/` ni `packages/`.
- [ ] Validacion JWT usa comparacion exacta de hostname via `new URL()`.
- [ ] Infinite scroll espera a que `loadMore()` termine antes de ocultar spinner.
- [ ] Icono de carrito vacio usa `colors.text.muted` o `Ionicons`.
- [ ] `Alert.alert()` de confirmacion antes de vaciar carrito.
- [ ] `turbo run typecheck` y `turbo run test` pasan.

### 3.2 Deuda Tecnica Critica

| ID | Descripcion | Archivos a modificar |
|---|---|---|
| **DEBT-001** | Cast `(db as any)` silencia incompatibilidad de tipos en hooks. | `apps/mobile/src/hooks/useCheckout.ts:47-49` |
| **DEBT-003** | `children: any` en providers. Debe ser `ReactNode`. | `apps/mobile/src/providers/AppProvider.tsx:102,156` |
| **DEBT-004** | `password_hash` incluido en schema PowerSync (riesgo PII). Debe excluirse de sync a SQLite. | `packages/sync/src/powersync-schema.ts` |

**Nota:** DEBT-002 (`FlashList as any`) se aplaza a Fase 4 si no bloquea la compilacion.

### 3.3 UX Critica (bloqueante para MVP)

| ID | Descripcion | Archivos a modificar |
|---|---|---|
| **UX-001** | Iconos de tabs son glifos Unicode (sin accesibilidad, inconsistentes). Migrar a Ionicons. | `apps/mobile/app/(tabs)/_layout.tsx:7` |
| **UX-002** | Tab bar sin safe area insets (oculta contenido en iPhone con Dynamic Island). | `apps/mobile/app/(tabs)/_layout.tsx:30-36` |
| **UX-003** | Touch targets de tabs 32×28px (bajo minimo Apple HIG de 44×44pt). | `apps/mobile/app/(tabs)/_layout.tsx:75` |
| **UX-004** | Skeleton sin animacion shimmer. Los rectangulos grises estaticos no comunican carga activa. | `apps/mobile/src/components/Skeleton.tsx`, `apps/mobile/app/(tabs)/index.tsx:42-52` |

**Criterios de aceptacion UX:**
- [ ] Todos los iconos de tabs usan `@expo/vector-icons` (Ionicons) con `accessibilityLabel`.
- [ ] Tab bar ajusta altura y padding con `useSafeAreaInsets()`.
- [ ] Touch targets ≥ 44×44pt en toda la UI (tabs, botones, iconos).
- [ ] Skeleton tiene animacion shimmer (opacity loop o `react-native-reanimated`).

---

## 4. Fase 1 — MVP Core POS

**Meta:** El cajero puede operar un dia completo sin fricciones. El flujo critico "login → catalogo → carrito → checkout → ordenes" es robusto, rapido y tolerante a fallos de red.

**Duracion:** 2 semanas (2 sprints)  
**Dependencias:** Fase 0 completada y mergeada.

### 4.1 Feature 1.1 — Banner Offline Global

**Descripcion:** Barra visible en todas las pantallas cuando el usuario esta offline. El `SyncBadge` actual es muy sutil.

**Archivos a modificar/crear:**
- `apps/mobile/app/_layout.tsx` — integrar banner global en el Stack principal
- `apps/mobile/src/components/OfflineBanner.tsx` (nuevo) — barra roja/amarilla con mensaje "Sin conexion — trabajando en modo local"

**Criterios de aceptacion:**
- [ ] Visible en todas las pantallas cuando `syncStatus === 'disconnected'`.
- [ ] No bloquea interaccion (position: absolute o paddingTop dinamico).
- [ ] Se oculta automaticamente al reconectar.
- [ ] Accesible: `accessibilityRole="alert"`, `accessibilityLabel` descriptivo.

### 4.2 Feature 1.2 — Error Boundary Global + Estados de Pantalla

**Descripcion:** Toda pantalla nueva (y existente) debe estar envuelta en `ErrorBoundary`. Ademas, cada pantalla debe manejar los 4 estados: loading (skeleton), empty, error (retry), success.

**Archivos a modificar/crear:**
- `apps/mobile/src/components/ErrorBoundary.tsx` — expandir cobertura a todas las rutas
- `apps/mobile/app/_layout.tsx` — envolver el root Stack con ErrorBoundary
- `apps/mobile/src/components/EmptyState.tsx` (nuevo) — ilustracion + mensaje + accion
- `apps/mobile/src/components/RetryButton.tsx` (nuevo) — boton reutilizable con feedback de press

**Criterios de aceptacion:**
- [ ] Crash en cualquier pantalla muestra fallback amigable (no pantalla en blanco).
- [ ] ErrorBoundary captura stack trace y lo envia a Sentry (si configurado).
- [ ] Toda pantalla con lista tiene estados: skeleton shimmer → empty state → error con retry → datos.
- [ ] Retry button tiene feedback visual de press (`opacity: 0.7`).

### 4.3 Feature 1.3 — Input de Cantidad Directa en Carrito

**Descripcion:** Los botones ±1 son ineficientes para cantidades grandes (ej: 50 unidades). Al tocar el numero de cantidad, debe abrirse un input numerico editable.

**Archivos a modificar/crear:**
- `apps/mobile/app/(tabs)/cart.tsx` — modal o inline TextInput al tocar cantidad
- `packages/application/src/use-cases/add-item-to-cart.ts` — validar cantidad maxima contra stock

**Criterios de aceptacion:**
- [ ] Tap en cantidad abre input numerico (teclado numerico).
- [ ] Validacion: entero positivo, no mayor que stock disponible.
- [ ] Si stock es insuficiente, muestra error inline y no aplica cambio.
- [ ] Funciona offline (validacion contra SQLite local).

### 4.4 Feature 1.4 — Nombre de Cliente en Orden

**Descripcion:** Campo opcional en el checkout para registrar `customer_name`. Util para historiales, llamar al cliente, y buscar ordenes posteriormente.

**Archivos a modificar/crear:**
- `apps/mobile/app/(tabs)/cart.tsx` — agregar campo `customer_name` antes del boton de checkout
- `packages/application/src/use-cases/checkout.ts` — incluir `customer_name` en la transaccion
- `apps/mobile/src/hooks/useCheckout.ts` — pasar `customer_name` al use case

**Criterios de aceptacion:**
- [ ] Campo opcional, maximo 100 caracteres.
- [ ] Se almacena en tabla `orders.customer_name`.
- [ ] Visible en detalle de orden (`order-detail.tsx`).
- [ ] Se puede buscar orden por nombre de cliente en el listado.

### 4.5 Feature 1.5 — Indicador de Sync Status Completo

**Descripcion:** Combinar `SyncBadge` (sutil) con informacion mas rica: ultima sync exitosa, numero de cambios pendientes, estado de conexion.

**Archivos a modificar/crear:**
- `apps/mobile/src/hooks/useSyncStatus.ts` — expandir para exponer `lastSyncedAt`, `pendingChangesCount`
- `apps/mobile/src/components/SyncStatusPanel.tsx` (nuevo) — panel expandible (tap en badge)

**Criterios de aceptacion:**
- [ ] Muestra estado: conectado / sincronizando / desconectado / error.
- [ ] Muestra timestamp de ultima sync exitosa (relativa: "Hace 2 min").
- [ ] Si hay cambios pendientes, muestra contador.
- [ ] Panel accesible desde cualquier pantalla (integrado en header global).

### 4.6 Feature 1.6 — Correcciones UX Medias (Fase 1)

| ID | Descripcion | Archivo |
|---|---|---|
| **UX-005** | Search bars a 40px (bajo minimo 44pt). Subir a 44px. | `apps/mobile/app/(tabs)/index.tsx:256`, `orders.tsx:272` |
| **UX-006** | Retry button sin feedback de press. Agregar opacity en pressed. | `apps/mobile/app/(tabs)/index.tsx:225` |
| **UX-007** | Font sizes < 12px en badges y labels. Subir a 12px minimo. | `orders.tsx:268`, `_layout.tsx:83` |

---

## 5. Fase 2 — Experiencia Profesional

**Meta:** El POS se siente como una herramienta real usada en comercios. Agrega velocidad (barcode), profesionalismo (recibo), y control operativo (cierre de caja, metodos de pago).

**Duracion:** 2–3 semanas (2–3 sprints)  
**Dependencias:** Fase 1 completada.

### 5.1 Feature 2.1 — Escaneo de Codigo de Barras

**Descripcion:** Un POS sin scanner manual tiene UX muy limitada para catalogos grandes. Implementar con `expo-camera` + `expo-barcode-scanner`.

**Archivos a modificar/crear:**
- `apps/mobile/app/(tabs)/index.tsx` — boton de scan en header del catalogo
- `apps/mobile/app/barcode-scanner.tsx` (nuevo) — pantalla de camara con overlay de scanner
- `packages/application/src/use-cases/find-item-by-barcode.ts` (nuevo) — busqueda por barcode en SQLite
- `packages/db/src/sqlite/repositories/item-repository.ts` — agregar `findByBarcode(barcode: string)`

**Criterios de aceptacion:**
- [ ] Boton de scan visible en catalogo.
- [ ] Abre camara con permisos solicitados correctamente.
- [ ] Al escanear, busca item en SQLite local (offline).
- [ ] Si encuentra item: lo agrega al carrito y regresa al catalogo.
- [ ] Si no encuentra: muestra mensaje "Producto no encontrado" + boton para crear (placeholder).
- [ ] Funciona en Android (target principal) e iOS.

### 5.2 Feature 2.2 — Recibo Compartible (PDF / Imagen)

**Descripcion:** Generar recibo de venta en formato imagen o PDF basico, compartible via WhatsApp, email o impresion. El `order-detail.tsx` ya tiene placeholder "Print Receipt".

**Archivos a modificar/crear:**
- `apps/mobile/app/order-detail.tsx` — reemplazar placeholder con accion real
- `apps/mobile/src/components/ReceiptView.tsx` (nuevo) — vista del recibo con datos de la orden
- `packages/application/src/use-cases/generate-receipt.ts` (nuevo) — logica de generacion de recibo
- `apps/mobile/src/utils/share-receipt.ts` (nuevo) — usar `react-native-view-shot` + Share API

**Criterios de aceptacion:**
- [ ] Recibo incluye: nombre del negocio (tenant), fecha, lineas de producto, cantidades, precios, total, metodo de pago.
- [ ] Formato: imagen PNG (primera version) o PDF basico.
- [ ] Compartible via Share Sheet nativo (WhatsApp, email, etc.).
- [ ] Funciona offline (generacion local, share se encola si no hay red).

### 5.3 Feature 2.3 — Metodos de Pago

**Descripcion:** Actualmente todas las ordenes usan un unico metodo implicito. Para negocios reales: efectivo, Yape, Plin, transferencia.

**Archivos a modificar/crear:**
- `packages/domain/src/entities/order.ts` — agregar `payment_method` al enum/estados
- `packages/db/src/sqlite/repositories/order-repository.ts` — persistir `payment_method`
- `apps/mobile/app/(tabs)/cart.tsx` — selector de metodo de pago antes del checkout
- `apps/mobile/src/components/PaymentMethodSelector.tsx` (nuevo) — botones de metodo de pago

**Criterios de aceptacion:**
- [ ] Metodos disponibles: efectivo, Yape, Plin, transferencia bancaria.
- [ ] Selector visible en pantalla de carrito antes de confirmar.
- [ ] Se almacena en `orders.payment_method`.
- [ ] Visible en detalle de orden y en recibo.
- [ ] Si es efectivo: opcionalmente calcular vuelto (input de monto recibido).

### 5.4 Feature 2.4 — Cierre de Caja Diario

**Descripcion:** Resumen al final del dia: total de ventas, cantidad de ordenes, desglose por metodo de pago y por tipo (producto/servicio). Exportable como imagen para compartir con el dueno.

**Archivos a modificar/crear:**
- `apps/mobile/app/cash-closing.tsx` (nuevo) — pantalla de cierre de caja
- `packages/application/src/use-cases/generate-cash-closing.ts` (nuevo) — query agregada sobre SQLite local
- `apps/mobile/src/hooks/useCashClosing.ts` (nuevo) — hook reactivo

**Criterios de aceptacion:**
- [ ] Muestra rango de fechas (default: hoy 00:00 a 23:59).
- [ ] Totales: monto total, cantidad de ordenes, ticket promedio.
- [ ] Desglose por metodo de pago (efectivo, Yape, Plin, transferencia).
- [ ] Desglose por tipo de item (producto vs servicio).
- [ ] Exportable como imagen/PDF via Share Sheet.
- [ ] Funciona 100% offline (datos de SQLite local).

### 5.5 Feature 2.5 — Correcciones UX Medias (Fase 2)

| ID | Descripcion | Archivo |
|---|---|---|
| **UX-008** | Emoji en titulos de AnalyticsPage web. Migrar a iconos SVG (Lucide). | `apps/web/src/pages/AnalyticsPage.tsx` |
| **UX-009** | AnalyticsPage con inline styles. Migrar a Tailwind CSS. | `apps/web/src/pages/AnalyticsPage.tsx` |
| **UX-010** | Password toggle con posicion absoluta hardcodeada. Usar flex wrapper. | `apps/mobile/app/(auth)/login.tsx:181` |

---

## 6. Fase 3 — Modulos por Industria

**Meta:** Un solo APK que se adapta automaticamente al tipo de negocio. El `modules_config` del tenant activa/oculta funcionalidades. Los datos de mesas y citas se sincronizan via PowerSync solo si el modulo esta habilitado.

**Duracion:** 3–4 semanas (3–4 sprints)  
**Dependencias:** Fase 2 completada. Requiere `modules_config` funcional en backend.

### 6.1 Feature 3.1 — Modulo Restaurante: Gestion de Mesas

**Descripcion:** Mapa de mesas como tab opcional en la navegacion. Visible solo si `modules_config.has_tables === true`. Permite asignar ordenes a mesas, ver estado de ocupacion, y gestionar la rotacion.

**Archivos a modificar/crear:**
- `apps/mobile/app/(tabs)/tables.tsx` (nuevo) — pantalla de mapa de mesas
- `apps/mobile/app/(tabs)/_layout.tsx` — tab condicional para mesas
- `packages/application/src/use-cases/manage-tables.ts` (nuevo) — CRUD de mesas + asignacion de ordenes
- `packages/db/src/sqlite/repositories/table-repository.ts` (nuevo) — implementar `ITableRepositoryPort`
- `packages/application/src/ports/table-repository.port.ts` (nuevo) — contrato

**Modelo de datos (ya existe en schema):**
```
tables_restaurant
  id UUID PK, tenant_id UUID FK, table_number INTEGER, status VARCHAR (free|occupied|billing)
```

**Criterios de aceptacion:**
- [ ] Tab "Mesas" visible solo si `modules_config.has_tables === true`.
- [ ] Grid visual de mesas: numero + estado (libre/verde, ocupada/rojo, cuenta/amarillo).
- [ ] Tap en mesa libre: permite crear nueva orden asociada a esa mesa.
- [ ] Tap en mesa ocupada: muestra orden activa con opcion de "Cerrar cuenta".
- [ ] Cambio de estado se refleja en tiempo real (PowerSync reactive query).
- [ ] Funciona offline (lectura/escritura local, sync cuando reconecta).

### 6.2 Feature 3.2 — Modulo Barberia: Calendario de Citas

**Descripcion:** Calendario semanal de citas. Visible solo si `modules_config.has_appointments === true`. Permite crear, editar y cancelar citas con validacion de superposicion de horarios.

**Archivos a modificar/crear:**
- `apps/mobile/app/(tabs)/appointments.tsx` (nuevo) — calendario semanal
- `apps/mobile/app/(tabs)/_layout.tsx` — tab condicional para citas
- `apps/mobile/app/appointment-detail.tsx` (nuevo) — detalle y edicion de cita
- `packages/application/src/use-cases/manage-appointments.ts` (nuevo) — CRUD de citas + validacion de superposicion
- `packages/db/src/sqlite/repositories/appointment-repository.ts` (nuevo) — implementar `IAppointmentRepositoryPort`
- `packages/application/src/ports/appointment-repository.port.ts` (nuevo) — contrato

**Modelo de datos (ya existe en schema):**
```
appointments
  id UUID PK, tenant_id UUID FK, customer_name VARCHAR,
  item_id UUID FK (servicio), start_time TIMESTAMP, status VARCHAR (scheduled|completed|cancelled|no_show)
```

**Criterios de aceptacion:**
- [ ] Tab "Citas" visible solo si `modules_config.has_appointments === true`.
- [ ] Vista semanal con dias y slots horarios.
- [ ] Crear cita: seleccionar servicio (de tabla `items` donde `type = 'service'`), cliente, fecha/hora.
- [ ] Validacion de superposicion: no permite dos citas al mismo tiempo para el mismo servicio/barbero.
- [ ] Estados: programada, completada, cancelada, no-show.
- [ ] Al completar cita: opcion de generar orden de venta automaticamente.
- [ ] Funciona offline (validacion de superposicion contra SQLite local).

### 6.3 Feature 3.3 — Navegacion y Dashboard Adaptativo

**Descripcion:** La pantalla de inicio (`index.tsx`) y la navegacion se adaptan segun `industry_type` y `modules_config`.

**Archivos a modificar/crear:**
- `apps/mobile/app/(tabs)/index.tsx` — dashboard adaptativo por industria
- `apps/mobile/src/hooks/useModulesConfig.ts` (nuevo) — hook para leer y parsear `modules_config` defensivamente

**Comportamiento por industria:**
- **retail (abarrote):** Dashboard muestra stock critico (items con stock bajo), ventas del dia, busqueda rapida.
- **restaurant:** Dashboard muestra mesas libres/ocupadas, ordenes activas por mesa, alertas de mesas con tiempo alto.
- **barbershop:** Dashboard muestra citas de hoy, proximas citas, servicios mas reservados.

**Criterios de aceptacion:**
- [ ] `modules_config` se lee correctamente con try/catch (fallback a defaults si JSON corrupto).
- [ ] Tabs se renderizan condicionalmente segun modulos habilitados.
- [ ] Dashboard adapta contenido principal segun `industry_type`.
- [ ] Si `modules_config` no tiene ningun modulo activo, muestra mensaje informativo + link a web dashboard para configurar.

---

## 7. Fase 4 — Escalamiento y Polish

**Meta:** Sistema completo listo para crecer y monetizar. Agrega funcionalidades avanzadas de negocio, cobertura de tests robusta, y preparacion para hardware periferico.

**Duracion:** 3–4 semanas (3–4 sprints)  
**Dependencias:** Fase 3 completada.

### 7.1 Feature 4.1 — Sistema de Descuentos

**Descripcion:** Campo en el carrito para aplicar descuento (porcentaje o monto fijo) antes de cobrar. Fundamental para promociones y negociacion.

**Archivos a modificar/crear:**
- `packages/domain/src/rules/pricing.ts` — agregar reglas de descuento
- `packages/application/src/use-cases/checkout.ts` — aplicar descuento en transaccion
- `apps/mobile/app/(tabs)/cart.tsx` — UI de descuento

**Criterios de aceptacion:**
- [ ] Descuento por porcentaje (ej: 10%) o monto fijo (ej: S/ 5.00).
- [ ] Validacion: descuento no puede hacer total negativo.
- [ ] Se almacena en `orders.discount_amount` y `orders.discount_type`.
- [ ] Visible en recibo y en detalle de orden.

### 7.2 Feature 4.2 — Flujo de Devolucion / Reembolso

**Descripcion:** El schema ya soporta `refunded` y `partially_refunded`. Agregar UI para iniciar devolucion desde `order-detail.tsx`.

**Archivos a modificar/crear:**
- `apps/mobile/app/order-detail.tsx` — agregar accion "Devolver" / "Reembolsar"
- `packages/application/src/use-cases/process-refund.ts` (nuevo) — validar estado y crear transaccion de reembolso
- `packages/domain/src/entities/order.ts` — validar transiciones de estado (paid → refunded, paid → partially_refunded)

**Criterios de aceptacion:**
- [ ] Solo ordenes en estado `paid` pueden reembolsarse.
- [ ] Reembolso parcial: seleccionar lineas a devolver y cantidad.
- [ ] Reembolso total: todas las lineas devueltas.
- [ ] Al reembolsar: estado cambia a `refunded` o `partially_refunded`, stock se restaura.
- [ ] Se registra `refunded_at` y `refund_reason` (opcional).

### 7.3 Feature 4.3 — Notificaciones Push (Stock Bajo)

**Descripcion:** Alertas cuando el stock de un producto baja por debajo de un umbral minimo.

**Archivos a modificar/crear:**
- `packages/application/src/use-cases/check-stock-alerts.ts` (nuevo) — logica de umbral
- `apps/mobile/src/utils/notifications.ts` (nuevo) — wrapper de Expo Notifications
- `apps/mobile/app/(tabs)/index.tsx` — solicitar permisos de notificacion

**Criterios de aceptacion:**
- [ ] Umbral minimo configurable por item (default: 5 unidades).
- [ ] Notificacion local push cuando stock <= umbral.
- [ ] Notificacion se muestra incluso si la app esta en segundo plano.
- [ ] Lista de "alertas de stock" visible en dashboard.

### 7.4 Feature 4.4 — Integracion de Hardware

**Descripcion:** Soporte basico para perifericos comunes en POS peruanos: impresora termica Bluetooth y lector de codigo de barras USB/Bluetooth.

**Archivos a modificar/crear:**
- `apps/mobile/src/utils/printer.ts` (nuevo) — wrapper de `react-native-thermal-receipt-printer` o similar
- `apps/mobile/app/settings.tsx` (nuevo) — pantalla de configuracion de hardware
- `apps/mobile/app/order-detail.tsx` — accion "Imprimir" ademas de "Compartir"

**Criterios de aceptacion:**
- [ ] Soporte para impresoras termicas Bluetooth (ESC/POS).
- [ ] Impresion de recibo formateado con nombre de negocio, items, total.
- [ ] Configuracion de MAC address de impresora en settings.
- [ ] Lector de codigo de barras USB/Bluetooth como alternativa a camara (para terminales dedicadas).

### 7.5 Feature 4.5 — Cobertura de Tests al 80%

**Descripcion:** Subir cobertura de tests desde ~50% actual a 80% global.

**Paquetes a cubrir:**
- `packages/domain` — 50% → 80% (reglas de pricing, subscription, inventory ya tienen tests, expandir)
- `packages/application` — 60% → 80% (nuevos use cases: manage-tables, manage-appointments, generate-receipt, process-refund)
- `packages/db` — 60% → 80% (repositorios SQLite con mocks)
- `packages/sync` — 0% → al menos 1 test significativo (schema validation)
- `packages/ui` — 0% → tests de tokens y componentes cross-platform
- `apps/mobile` — dummy → tests de hooks principales (useCheckout, useSyncStatus, useCashClosing)

**Criterios de aceptacion:**
- [ ] `turbo run test` pasa con ≥ 80% de cobertura global.
- [ ] Tests unitarios sin conexion a Supabase ni PowerSync (usar mocks/builders).
- [ ] Al menos 1 test E2E del flujo critico (Maestro o Detox): login → catalogo → carrito → checkout → ordenes.

### 7.6 DevOps y Estabilizacion

| Tarea | Descripcion |
|---|---|
| **EAS Build** | Configurar perfiles de build para Produccion y Staging en `eas.json`. |
| **EAS Update (OTA)** | Configurar canal de updates OTA para parches JS/TS sin nuevo APK. |
| **Schema Migrations** | Implementar migration runner SQLite que ejecute `ALTER TABLE` al detectar version antigua. |
| **Sentry** | Integrar Sentry para captura de errores con stack traces offline. |
| **Staging vs Prod** | Diferentes App IDs (`com.misaas.app` vs `com.misaas.app.staging`), iconos y DBs aislados. |

---

## 8. Dependencias entre Fases

```
Fase 0 (Fundamentos)
  |
  v
Fase 1 (MVP Core POS)
  |
  +---> Fase 2 (Experiencia Profesional)
  |       |
  |       v
  |     Fase 3 (Modulos por Industria)
  |       |
  |       v
  |     Fase 4 (Escalamiento)
  |
  +---> Fase 4 puede empezar en paralelo con Fase 3
          (tests y DevOps son independientes de modulos)
```

**Nota critica:** Fase 0 es **bloqueante absoluto**. Ninguna feature nueva debe desarrollarse antes de que los bugs criticos del AUDIT esten corregidos.

---

## 9. Criterios de Aceptacion Globales (aplican a todas las fases)

- [ ] **Clean Architecture:** Ninguna pantalla contiene logica de negocio. Los use cases estan en `packages/application`.
- [ ] **Offline-First:** Toda escritura va a SQLite local primero. PowerSync sincroniza async.
- [ ] **Multi-Tenant:** Toda query filtra por `tenant_id`. RLS en backend como segunda capa.
- [ ] **Type Safety:** Sin `any` (salu wrappers tecnicamente justificados). `turbo run typecheck` pasa.
- [ ] **Testing:** Cada use case nuevo tiene tests unitarios. Cada hook nuevo tiene test con mock.
- [ ] **Accesibilidad:** Touch targets ≥ 44×44pt. `accessibilityLabel` en iconos y botones. Font sizes ≥ 12px.
- [ ] **Estados de UI:** Toda pantalla con datos maneja loading (skeleton), empty, error (retry), success.
- [ ] **Seguridad:** Ningun dato sensible en logs. JWT validado con comparacion exacta de hostname.

---

## 10. Checklist de Sprint Inmediato (Fase 0)

- [ ] **BUG-001** — Reemplazar `user_id: 'demo-user-id'` con ID del usuario autenticado
- [ ] **BUG-002** — Agregar `LoadingScreen` mientras DB inicializa + manejar error de init
- [ ] **BUG-003** — Eliminar `console.log` con datos de tenant y analytics
- [ ] **BUG-004** — Corregir validacion JWT con URL parsing exacto
- [ ] **BUG-005** — Corregir `handleEndReached` para esperar async `loadMore`
- [ ] **BUG-006** — Corregir color del icono vacio en carrito
- [ ] **BUG-007** — Agregar confirmacion al vaciar carrito
- [ ] **DEBT-001** — Resolver incompatibilidad de tipos con `(db as any)`
- [ ] **DEBT-003** — Tipar `children` como `ReactNode`
- [ ] **DEBT-004** — Excluir `password_hash` de schema PowerSync
- [ ] **UX-001** — Reemplazar glifos Unicode de tabs con Ionicons
- [ ] **UX-002** — Agregar safe area insets a la tab bar
- [ ] **UX-003** — Aumentar touch targets de iconos a 44×44
- [ ] **UX-004** — Implementar skeleton shimmer animado

---

## 11. Definicion de MVP Listo

El MVP se considera **listo para usuarios reales** al completar las **Fases 0, 1 y 2**.

**Flujo critico que debe funcionar sin fallos:**
1. Login / Onboarding (seleccion de tipo de negocio)
2. Catalogo de productos (busqueda, filtro, scan de barcode)
3. Carrito (cantidad directa, descuentos, metodo de pago, nombre de cliente)
4. Checkout (validacion offline de suscripcion, stock, transaccion atomica)
5. Ordenes (listado, detalle, recibo compartible)
6. Cierre de caja (resumen diario)
7. Sincronizacion offline/online (PowerSync, banner de estado)

**Calidad minima esperada:**
- 0 bugs criticos abiertos.
- `turbo run typecheck` + `turbo run test` + `turbo run build` pasando.
- APK generable via `./gradlew assembleRelease` sin errores.
- App funcional sin internet durante 8+ horas de operacion.

---

## 12. Referencias

- `ALCANCES_Y_REQUERIMIENTOS.md` — Vision del producto, stack, modelo de datos, RF/RNF
- `AUDIT.md` — Bugs, debt, UX issues identificados (Abril 2026)
- `PLAN.md` — Plan de implementacion del dashboard web (referencia de formato)
- `AI_RULES.md` — Reglas de arquitectura y convenciones de codigo
- `guia-arquitectonica-y-devOps.md` — Paradigmas, pilares operativos, roadmap
- `MOBILE_DEPLOYMENT_GUIDE.md` — Comandos de compilacion y deploy
- `bdd.md` — Modelo de datos detallado

---

*Plan generado por OpenCode — Mayo 2026.*
*Basado en: AUDIT.md, ALCANCES_Y_REQUERIMIENTOS.md, AI_RULES.md, PLAN.md, guia-arquitectonica-y-devOps.md, codigo fuente en apps/mobile y packages/.*
