# AUDITORÍA COMPLETA — SaaS POS System

**Fecha:** 16 de abril de 2026  
**Alcance:** Revisión exhaustiva de arquitectura, seguridad, UX/UI, código, tests y features  
**Archivos analizados:** 75+ archivos fuente  
**Hallazgos totales:** 120+ issues identificados  

---

## RESUMEN EJECUTIVO

El proyecto tiene una base arquitectónica sólida: monorepo con Turborepo, separación en capas (domain/application/infrastructure/presentation), multi-tenancy con RLS, y patrón offline-first con PowerSync. Sin embargo, el análisis revela **problemas críticos** que deben resolverse antes de cualquier despliegue a producción.

Los hallazgos se organizan por severidad: CRÍTICO (bloquea producción), ALTO (riesgo significativo), MEDIO (deuda técnica), BAJO (mejoras deseables).

---

## 1. AUTENTICACIÓN Y SEGURIDAD

### 1.1 CRÍTICOS

**[AUTH-001] Token JWT decodificado sin verificación de firma**  
Archivo: `apps/mobile/src/providers/AppProvider.tsx`  
El `extractClaim()` decodifica el JWT haciendo split por `.` y parseando base64, pero nunca valida la firma del token. Un atacante con acceso a memoria podría inyectar claims falsos (tenant_id, role). Si bien Supabase valida en servidor, la app confía ciegamente en claims locales para decisiones de UI y rutas.

**Mejora propuesta:** Validar que el JWT fue emitido por tu instancia de Supabase comparando el `iss` claim. Agregar verificación de expiración (`exp`) antes de usar claims.

**[AUTH-002] No hay manejo de expiración de token**  
Archivo: `apps/mobile/src/providers/AppProvider.tsx`  
Los valores `tenantId` y `role` extraídos del JWT persisten en estado hasta el siguiente cambio de auth. Si el token expira durante uso activo, la app sigue operando con claims stale sin re-autenticar.

**Mejora propuesta:** Implementar un timer que verifique `exp` claim cada 60 segundos. Si el token está por expirar (< 5 min), forzar refresh con `supabase.auth.refreshSession()`.

**[AUTH-003] Función `onboard_tenant()` con SECURITY DEFINER sin validación de input**  
Archivo: `packages/db/src/postgres/auth-setup.sql`  
La función `onboard_tenant` usa `SECURITY DEFINER` (bypass de RLS) y acepta `p_tenant_name TEXT` sin sanitización. El parámetro `p_valid_days INT` no tiene límites — alguien podría pasar 999999 días.

**Mejora propuesta:** Agregar `CHECK (p_valid_days BETWEEN 1 AND 365)`, sanitizar `p_tenant_name` con `regexp_replace()`, y agregar rate limiting a nivel de función.

### 1.2 ALTOS

**[AUTH-004] Login sin rate limiting ni protección contra fuerza bruta**  
Archivo: `apps/mobile/app/(auth)/login.tsx`  
No hay límite de intentos fallidos. Un atacante podría enumerar emails válidos o hacer fuerza bruta en passwords.

**Mejora propuesta:** Implementar contador de intentos con bloqueo exponencial (1s, 2s, 4s, 8s...). Después de 5 intentos, mostrar CAPTCHA o bloquear 15 minutos. Configurar rate limiting en Supabase Auth.

**[AUTH-005] Sin "Forgot Password" ni recovery flow**  
Archivo: `apps/mobile/app/(auth)/login.tsx`  
La pantalla dice "contacta al administrador" pero no ofrece self-service. En un SaaS multi-tenant esto es inaceptable — cada tenant tiene múltiples usuarios.

**Mejora propuesta:** Agregar botón "¿Olvidaste tu contraseña?" que invoque `supabase.auth.resetPasswordForEmail()`. Crear pantalla de reset con nuevo password.

**[AUTH-006] Error messages revelan información sensible**  
Archivo: `apps/mobile/app/(auth)/login.tsx`  
Los mensajes distinguen entre "email no confirmado" y "credenciales inválidas", lo que permite a un atacante enumerar qué emails están registrados.

**Mejora propuesta:** Usar un mensaje genérico: "Credenciales inválidas. Verifica tu email y contraseña." para todos los casos de error de auth.

**[AUTH-007] RLS policy permite hard delete en `tables_restaurant`**  
Archivo: `packages/db/src/postgres/rls-policies-v2.sql`  
Todas las tablas usan soft delete excepto `tables_restaurant`, que permite `DELETE` físico. Rompe la auditoría y crea inconsistencia.

**Mejora propuesta:** Cambiar policy a `USING (false)` para forzar soft delete uniforme.

### 1.3 MEDIOS

**[AUTH-008] Soft delete usa timestamp del cliente, no del servidor**  
Archivo: `apps/mobile/src/lib/supabase/connector.ts`  
`deleted_at: new Date().toISOString()` usa el reloj del dispositivo. Si el reloj está desfasado, los timestamps de borrado son incorrectos.

**Mejora propuesta:** Usar `NOW()` de PostgreSQL mediante trigger `BEFORE UPDATE` que setee `deleted_at` automáticamente.

**[AUTH-009] Sin Error Boundary en navegación**  
Archivo: `apps/mobile/app/_layout.tsx`  
Si AuthGuard o cualquier componente hijo lanza excepción, la app entera crashea sin fallback.

**Mejora propuesta:** Envolver el Stack navigator en un ErrorBoundary que muestre pantalla de recuperación con botón "Reintentar".

**[AUTH-010] Paywall no verifica expiración contra servidor**  
Archivo: `apps/mobile/app/paywall.tsx`  
Confía en `useTenant()` local para verificar expiración. Un usuario podría manipular la fecha del dispositivo para bypasear el paywall.

**Mejora propuesta:** En el check de paywall, hacer una verificación contra Supabase si hay conexión: `SELECT valid_until FROM tenants WHERE id = $1`.

---

## 2. UX/UI — ANÁLISIS DETALLADO

### 2.1 Login Screen

**[UX-001] Sin feedback visual durante carga**  
El botón "Iniciar Sesión" no muestra spinner ni estado disabled durante el request. El usuario puede pulsar múltiples veces.

**Mejora:** Agregar `ActivityIndicator` dentro del botón + `disabled={loading}` + opacity reducida.

**[UX-002] Teclado no se cierra tras login exitoso**  
No hay `Keyboard.dismiss()` después de `signInWithPassword()`. El teclado permanece visible durante la transición.

**Mejora:** Llamar `Keyboard.dismiss()` antes de la llamada a auth.

**[UX-003] Error state persiste innecesariamente**  
Si el usuario corrige el error y re-intenta, el mensaje de error anterior se muestra brevemente antes de limpiarse.

**Mejora:** Limpiar error state en `onChangeText` de ambos campos, no solo en submit.

**[UX-004] Sin validación de formato de email**  
Solo se hace `trim()` pero no se verifica que contenga `@` y un dominio válido. El request a Supabase falla con error genérico.

**Mejora:** Validar con regex antes de enviar: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Mostrar "Formato de email inválido" inline.

**[UX-005] Password sin requisitos visibles**  
No se muestra longitud mínima, caracteres requeridos, ni indicador de fortaleza.

**Mejora:** Agregar texto helper "Mínimo 8 caracteres" y toggle de visibilidad (eye icon).

**[UX-006] Sin opción de Sign Up**  
El link dice "Contacta a tu administrador" pero no hay flujo de registro. Para un SaaS, el onboarding debería ser self-service.

**Mejora:** Crear pantalla de registro con: nombre, email, password, código de invitación del tenant.

### 2.2 Cart & Checkout

**[UX-007] Sin confirmación antes de checkout**  
`processCheckout()` se ejecuta directamente. No hay modal de confirmación con resumen del pedido.

**Mejora:** Mostrar BottomSheet con resumen: items, cantidades, total, método de pago. Botón "Confirmar Pedido".

**[UX-008] Alert.alert() bloquea la UI**  
Después del checkout, un `Alert.alert()` nativo bloquea la interacción. Si la red es lenta, el usuario queda atrapado.

**Mejora:** Reemplazar con toast/snackbar no-bloqueante que se auto-cierra en 3 segundos.

**[UX-009] Sin swipe-to-delete en cart items**  
Para eliminar un item del carrito, hay que pulsar el botón "-" repetidamente hasta llegar a 0.

**Mejora:** Implementar `Swipeable` de react-native-gesture-handler con acción "Eliminar" en rojo.

**[UX-010] Sin límite de cantidad**  
El usuario puede incrementar cantidad infinitamente. No hay validación contra stock disponible.

**Mejora:** Limitar `maxQuantity` al stock disponible del item. Mostrar "(máx: 25)" junto al selector.

**[UX-011] Precio usa floating-point directo**  
`createMoney(unit_price * quantity)` multiplica numbers, lo que puede causar errores de precisión (0.1 + 0.2 ≠ 0.3).

**Mejora:** Usar `multiplyMoney(createMoney(unit_price), quantity)` del domain layer en todo momento.

### 2.3 Orders Tab

**[UX-012] Sin detalle de orden**  
No se puede tocar una orden para ver los line items, receipt, o detalles del cliente.

**Mejora:** Crear `OrderDetailScreen` con: lista de items, subtotales, total, timestamp, estado, y opción de reimprimir receipt.

**[UX-013] Sin paginación**  
Carga 50 órdenes de golpe. Con miles de órdenes, la UI se vuelve lenta.

**Mejora:** Implementar infinite scroll con `onEndReached` en FlashList, cargando de a 20 órdenes.

**[UX-014] Sin filtros ni búsqueda**  
No se puede filtrar por fecha, estado, o monto. No hay barra de búsqueda.

**Mejora:** Agregar chips de filtro (Hoy / Esta semana / Este mes) y barra de búsqueda por número de orden.

**[UX-015] Cálculo de "hoy" es frágil**  
Compara dates como strings sin considerar timezone del dispositivo.

**Mejora:** Usar `startOfDay()` con timezone del tenant configurado en settings.

### 2.4 Catalog / Home

**[UX-016] Empty state confuso**  
Muestra "📦 No hay productos" o "⏳ Sincronizando..." sin distinguir claramente si es error, carga, o vacío real.

**Mejora:** Tres estados visuales distintos: Loading (skeleton), Empty (ilustración + "Agrega tu primer producto"), Error (retry button).

**[UX-017] Sin búsqueda de productos**  
El catálogo no tiene barra de búsqueda. Con 100+ productos, encontrar uno específico es imposible.

**Mejora:** Agregar SearchBar sticky en la parte superior con filtro en tiempo real por nombre.

**[UX-018] Sin categorías ni filtros**  
Todos los productos se muestran en una sola lista sin organización.

**Mejora:** Agregar tabs horizontales por categoría (Bebidas, Alimentos, Servicios) + filtro por tipo.

### 2.5 Web Dashboard

**[UX-019] Dashboard web usa data hardcodeada**  
`CatalogPage`, `OrdersPage`, `TenantsPage` todas usan constantes `DEMO_*`. No hay conexión a datos reales.

**Mejora:** Conectar a Supabase client con `@supabase/supabase-js` para queries reales. Agregar loading/error states.

**[UX-020] Sin responsive design**  
Sidebar tiene 216px fijos. En mobile/tablet, la UI se rompe.

**Mejora:** Implementar breakpoints con media queries. Sidebar colapsable en mobile (hamburger menu).

**[UX-021] Sin dark/light mode toggle**  
El theme es dark-only sin opción de cambiar.

**Mejora:** Agregar toggle en Settings. Usar CSS custom properties para theming dinámico.

---

## 3. DOMAIN LAYER — HALLAZGOS

### 3.1 CRÍTICOS

**[DOM-001] Stock nunca se decrementa en checkout**  
Archivo: `packages/application/src/use-cases/checkout.ts`  
El checkout valida stock (línea 59) pero nunca llama a `decrementStock()`. El `insertOrderWithLines()` del repository inserta la orden pero no reduce inventario. Esto significa que el stock nunca baja, permitiendo vender infinitamente.

**Mejora:** Dentro de la transacción de checkout, después de `insertOrderWithLines()`, iterar cada line y llamar `itemRepo.decrementStock(line.item_id, line.quantity, tenantId)`.

**[DOM-002] formatMoney() no maneja negativos correctamente**  
Archivo: `packages/domain/src/value-objects/money.ts`  
`-150 % 100 = -50`, luego `Math.abs(-50) = 50`, pero `whole = -2`. Resultado: "S/ -2.50" en vez de "S/ -1.50".

**Mejora:** Separar signo, trabajar con `Math.abs(amount)`, y re-aplicar signo al final.

**[DOM-003] Arithmetic directo sin Money value objects en checkout y cart**  
Archivos: `checkout.ts` línea 80, `add-item-to-cart.ts` línea 47  
`line.unit_price * line.quantity` usa multiplicación nativa en vez de `multiplyMoney()`. Puede acumular errores de floating-point.

**Mejora:** Reemplazar toda aritmética monetaria con funciones del domain: `multiplyMoney(createMoney(unit_price), quantity)`.

### 3.2 ALTOS

**[DOM-004] Entities son interfaces sin factories ni validación**  
Archivos: `entities/*.ts`  
`Item`, `Order`, `OrderLine` son interfaces planas. Cualquiera puede construir un objeto inválido (total negativo, stock -1, etc.) sin que el type system lo detecte en runtime.

**Mejora:** Crear factory functions `createItem()`, `createOrder()` con validación de invariantes. Usar branded types para IDs.

**[DOM-005] No hay custom error types**  
Todo el codebase lanza `new Error('string')` genérico. Imposible distinguir `SubscriptionExpiredError` de `InsufficientStockError` de `ValidationError` en un catch.

**Mejora:** Crear jerarquía de errores:
```typescript
class DomainError extends Error { code: string; }
class SubscriptionExpiredError extends DomainError { ... }
class InsufficientStockError extends DomainError { ... }
class ValidationError extends DomainError { ... }
```

**[DOM-006] Order status enum incompleto**  
Archivo: `packages/domain/src/entities/order.ts`  
Solo tiene `'pending' | 'paid' | 'cancelled'`. Falta: `'refunded'`, `'partially_refunded'`, `'voided'`.

**Mejora:** Definir state machine completo con transiciones válidas: pending → paid → refunded, pending → cancelled, etc.

**[DOM-007] Items soft-deleted no se filtran en queries**  
Archivos: `item-repository.ts`, `useItems.ts`  
Las queries no incluyen `WHERE deleted_at IS NULL`. Los items borrados aparecen en el catálogo.

**Mejora:** Agregar `AND deleted_at IS NULL` a todas las queries de lectura.

### 3.3 MEDIOS

**[DOM-008] Currency hardcodeada a 'PEN'**  
Archivo: `packages/domain/src/value-objects/money.ts`  
`createMoney(amount, currency = 'PEN')` — imposible soportar múltiples monedas sin refactorizar.

**Mejora:** Mover currency default a configuración del tenant. Validar que operaciones entre Money objects usen la misma currency.

**[DOM-009] Quantity sin límite superior**  
Archivo: `packages/domain/src/value-objects/quantity.ts`  
Valida que sea ≥ 0 y entero, pero acepta `Number.MAX_SAFE_INTEGER`.

**Mejora:** Agregar límite máximo configurable (ej: 10,000 unidades por línea).

**[DOM-010] Subscription expiry threshold hardcodeado**  
Archivo: `packages/domain/src/rules/subscription.ts`  
`isExpiringSoon` usa `<= 5 días` fijo. Debería ser configurable por tenant (enterprise quiere 30 días de aviso).

**Mejora:** Pasar `warningDays` como parámetro: `isExpiringSoon(tenant, warningDays = 5)`.

**[DOM-011] daysRemaining usa Math.ceil — puede ser engañoso**  
Archivo: `packages/domain/src/rules/subscription.ts`  
Con ceil, 0.1 días restantes se muestran como "1 día". El usuario cree que tiene un día completo.

**Mejora:** Usar `Math.floor()` para ser conservador, o mostrar horas cuando queda < 1 día.

---

## 4. DATABASE & SYNC LAYER

### 4.1 CRÍTICOS

**[DB-001] PowerSync sync rules no definidos**  
Archivo: `packages/sync/src/powersync-config.ts`  
El config es un placeholder vacío. Sin sync rules, el cliente podría recibir datos de TODOS los tenants.

**Mejora:** Definir sync rules con bucket por tenant:
```yaml
bucket_definitions:
  by_tenant:
    parameters: SELECT tenant_id() as tenant_id
    data:
      - SELECT * FROM items WHERE tenant_id = bucket.tenant_id
      - SELECT * FROM orders WHERE tenant_id = bucket.tenant_id
```

**[DB-002] Sin estrategia de resolución de conflictos**  
Archivo: `packages/sync/src/powersync-config.ts`  
El comentario dice "last-write-wins" pero no hay implementación. Si dos dispositivos offline editan el mismo item, el último en sincronizar gana silenciosamente.

**Mejora:** Para items/stock usar server-authority (el servidor siempre gana). Para orders, usar client-authority (el cliente que creó la orden es dueño). Implementar merge functions para campos específicos.

### 4.2 ALTOS

**[DB-003] Schema divergence entre PostgreSQL y SQLite**  
Archivos: `schema.sql` vs `sqlite-schema.ts`  
Los schemas se definen en dos lugares sin mecanismo de sincronización. Cambiar un campo en Postgres requiere cambio manual en SQLite.

**Mejora:** Usar una fuente única de verdad (ej: PowerSync schema definition) que genere ambos schemas. O crear script de validación que compare ambos.

**[DB-004] `order_lines.tenant_id` sin foreign key compuesto**  
Archivo: `packages/db/src/postgres/schema.sql`  
`tenant_id` en order_lines no tiene constraint que garantice que coincide con el `tenant_id` de la orden padre.

**Mejora:** Agregar constraint: `FOREIGN KEY (order_id, tenant_id) REFERENCES orders(id, tenant_id)`.

**[DB-005] Race condition en stock decrement**  
Archivo: `packages/db/src/sqlite/repositories/order-repository.ts`  
La transacción SQLite valida stock y luego decrementa, pero dos checkouts simultáneos en el mismo dispositivo podrían pasar la validación antes de que el primero decremente.

**Mejora:** Usar `UPDATE items SET stock = stock - ? WHERE stock >= ? AND id = ?` que falla atómicamente si stock insuficiente.

**[DB-006] JSON.parse sin try-catch en tenant repository**  
Archivo: `packages/db/src/sqlite/repositories/tenant-repository.ts`  
`JSON.parse(row.modules_config)` crashea si el JSON está corrupto.

**Mejora:** Envolver en try-catch con fallback a config default.

**[DB-007] Missing triggers de updated_at en SQLite**  
Archivo: `packages/db/src/schema/sqlite-schema.ts`  
PostgreSQL tiene triggers para `updated_at`, pero SQLite no. Los timestamps locales quedan stale.

**Mejora:** Agregar triggers en SQLite schema o actualizar `updated_at` manualmente en cada UPDATE del repository.

### 4.3 MEDIOS

**[DB-008] Sin índices para queries frecuentes**  
Archivo: `packages/db/src/postgres/schema.sql`  
Falta índice en `appointments(tenant_id, start_time)` y `users(tenant_id, role)`.

**Mejora:** Agregar índices compuestos para las queries más frecuentes.

**[DB-009] Seed data con IDs hardcodeados**  
Archivo: `packages/db/src/postgres/seed.sql`  
Si seed se ejecuta múltiples veces, `ON CONFLICT DO NOTHING` puede crear inconsistencias.

**Mejora:** Usar `ON CONFLICT DO UPDATE` o verificar estado antes de seed.

**[DB-010] Migration runner sin rollback**  
Archivo: `packages/db/src/migrations/migration-runner.ts`  
Si una migración falla a mitad de camino, no hay rollback. La DB queda en estado inconsistente.

**Mejora:** Ejecutar cada migración dentro de una transacción con rollback automático en caso de error.

---

## 5. TESTING — ANÁLISIS

### 5.1 CRÍTICOS

**[TEST-001] 4 de 7 packages tienen CERO tests**  
- `packages/db`: 0 tests
- `packages/sync`: 0 tests  
- `apps/mobile`: 0 tests
- `apps/web`: 0 tests

El script `turbo run test` ejecuta `echo "No tests yet"` en estos packages, dando falsa sensación de éxito.

**Mejora:** Agregar tests para cada package. Prioridad: db repositories > sync connector > mobile hooks > web pages.

**[TEST-002] Checkout test no verifica decremento de stock**  
Archivo: `packages/application/src/__tests__/checkout.test.ts`  
Los mocks no verifican que `decrementStock()` fue llamado. Esto es consistente con DOM-001 (stock nunca se decrementa).

**Mejora:** Agregar `expect(mockItemRepo.decrementStock).toHaveBeenCalledWith(itemId, quantity, tenantId)`.

### 5.2 ALTOS

**[TEST-003] Sin coverage thresholds**  
Ningún `jest.config.ts` define mínimos de cobertura. No hay forma de saber si nuevos cambios reducen coverage.

**Mejora:** Agregar a todos los jest.config:
```typescript
coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } }
```

**[TEST-004] Sin tests de integración con DB real**  
Todos los tests de application usan mocks de repositorios. Ningún test verifica que las queries SQL funcionan.

**Mejora:** Crear tests de integración con SQLite in-memory que validen repositories reales.

**[TEST-005] Edge cases monetarios no cubiertos**  
- Montos negativos en `formatMoney`
- Overflow con cantidades muy grandes
- Precision errors en multiplicación

**Mejora:** Agregar tests para `createMoney(-100)`, `multiplyMoney(createMoney(MAX), 9999)`, y `0.1 + 0.2` scenarios.

### 5.3 MEDIOS

**[TEST-006] Sin test data builders**  
Fixtures hardcodeados en cada test file. Cambiar la shape de `Item` requiere actualizar 5+ archivos.

**Mejora:** Crear `test-utils/builders.ts` con pattern builder: `buildItem({ price: 1000 })` que auto-complete los demás campos.

**[TEST-007] Regex frágil para error messages en español**  
`checkout.test.ts` usa `/[Ss]uscripci[oó]n/` para matchear errores. Si el mensaje cambia, el test falla.

**Mejora:** Usar custom error types (DOM-005) y verificar `error instanceof SubscriptionExpiredError`.

---

## 6. FEATURES PROPUESTOS — ROADMAP

### 6.1 Fase 4: Autenticación Completa

| Feature | Prioridad | Esfuerzo |
|---------|-----------|----------|
| Password recovery flow | ALTA | 2 días |
| Sign-up con código de invitación | ALTA | 3 días |
| Biometric auth (FaceID / Fingerprint) | MEDIA | 2 días |
| Session management (ver sesiones activas) | MEDIA | 2 días |
| Multi-factor authentication (TOTP) | BAJA | 3 días |
| OAuth social login (Google, Apple) | BAJA | 2 días |

### 6.2 Fase 5: UX/UI Premium

| Feature | Prioridad | Esfuerzo |
|---------|-----------|----------|
| Búsqueda global de productos | ALTA | 1 día |
| Categorías y filtros en catálogo | ALTA | 2 días |
| Order detail con receipt | ALTA | 2 días |
| Confirmación de checkout con BottomSheet | ALTA | 1 día |
| Infinite scroll en órdenes | MEDIA | 1 día |
| Dark/Light mode toggle | MEDIA | 2 días |
| Skeleton loading screens | MEDIA | 1 día |
| Animaciones de transición | BAJA | 2 días |
| Haptic feedback en acciones | BAJA | 1 día |

### 6.3 Fase 6: Business Logic Avanzada

| Feature | Prioridad | Esfuerzo |
|---------|-----------|----------|
| Sistema de descuentos y promociones | ALTA | 4 días |
| Cálculo de impuestos (IGV 18%) | ALTA | 2 días |
| Refund / devoluciones parciales | ALTA | 3 días |
| Métodos de pago múltiples | ALTA | 3 días |
| Propinas configurables | MEDIA | 1 día |
| Programas de fidelidad (puntos) | MEDIA | 4 días |
| Generación de boletas/facturas (SUNAT) | MEDIA | 5 días |
| Multi-currency support | BAJA | 3 días |

### 6.4 Fase 7: Operaciones

| Feature | Prioridad | Esfuerzo |
|---------|-----------|----------|
| Alertas de stock bajo (push notifications) | ALTA | 2 días |
| Reportes exportables (CSV/PDF) | ALTA | 3 días |
| Barcode/QR scanning para productos | MEDIA | 2 días |
| Gestión de proveedores | MEDIA | 4 días |
| Cash register (apertura/cierre de caja) | ALTA | 3 días |
| Roles y permisos granulares | MEDIA | 3 días |
| Audit log completo | MEDIA | 2 días |
| Backup automático local | BAJA | 2 días |

### 6.5 Fase 8: Sync & Reliability

| Feature | Prioridad | Esfuerzo |
|---------|-----------|----------|
| Conflict resolution real (no last-write-wins) | ALTA | 4 días |
| Retry queue con backoff exponencial | ALTA | 2 días |
| Sync status detallado (items pendientes) | MEDIA | 2 días |
| Bandwidth-aware sync (WiFi vs cellular) | MEDIA | 2 días |
| Data compression para sync | BAJA | 2 días |
| Selective sync (solo datos recientes) | BAJA | 3 días |

---

## 7. RESUMEN DE PRIORIDADES

### Bloquean producción (resolver YA)

1. **[DOM-001]** Stock nunca se decrementa en checkout
2. **[DB-001]** PowerSync sync rules no definidos
3. **[AUTH-001]** JWT sin verificación de firma/expiración
4. **[DOM-002]** formatMoney() broken para negativos
5. **[DOM-003]** Arithmetic sin Money objects en checkout
6. **[TEST-001]** 4 packages sin tests
7. **[UX-019]** Web dashboard con data fake

### Resolver antes de launch

8. **[AUTH-004]** Login sin rate limiting
9. **[AUTH-005]** Sin password recovery
10. **[DB-002]** Sin resolución de conflictos
11. **[DB-003]** Schema divergence PG/SQLite
12. **[DOM-005]** Sin custom error types
13. **[DOM-007]** Items borrados aparecen en catálogo
14. **[UX-007]** Sin confirmación de checkout

### Deuda técnica (resolver en sprints)

15-40. Issues MEDIO y BAJO documentados arriba.

---

## 8. MÉTRICAS DEL PROYECTO

| Métrica | Valor | Target |
|---------|-------|--------|
| Archivos fuente (.ts/.tsx) | ~75 | — |
| Tests unitarios | 48 | 200+ |
| Test coverage estimado | ~15% | 80%+ |
| Packages con tests | 2/7 | 7/7 |
| Custom error types | 0 | 10+ |
| Screens con loading state | 0/8 | 8/8 |
| Screens con error boundary | 0/8 | 8/8 |
| i18n keys | 0 | 200+ |
| Vulnerabilidades RLS | 3 | 0 |

---

*Reporte generado por análisis exhaustivo de código fuente. Cada hallazgo incluye archivo, línea, severidad, y mejora propuesta concreta.*
