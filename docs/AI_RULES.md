# AI Development Rules — saas-pos

> Este archivo define las reglas que todo agente de IA (Claude, Cursor, Copilot, etc.) debe
> seguir al trabajar en este repositorio. Están basadas en una auditoría técnica del código real.
> Actualizar este archivo al introducir cambios arquitectónicos significativos.

---

## 1. Arquitectura y capas

### Respetar la pirámide de dependencias
Las dependencias SOLO fluyen hacia adentro. Nunca al revés.

```
apps/mobile  ──┐
apps/web     ──┼──▶  packages/db  ──▶  packages/application  ──▶  packages/domain
               │         │
               └─────────┴──▶  packages/ui  │  packages/utils  │  packages/sync
```

- `packages/domain` no importa NADA externo. Cero dependencias fuera del estándar TypeScript.
- `packages/application` solo importa de `domain` y `utils`. Nunca de `db`, nunca de `ui`.
- `packages/db` implementa los ports de `application`. Es la única capa que toca PowerSync/Supabase.
- `apps/` son consumidores finales. Instancian use cases con las implementaciones concretas de `db`.

**Regla para el agente:** Si necesitas lógica de negocio en un componente de `apps/`, es una señal de
que falta un use case en `packages/application`. Créalo ahí, no en el componente.

### Un solo camino de checkout
El use case canónico para crear una orden es `packages/application/src/use-cases/checkout.ts`.
Si necesitas crear una orden desde la web, instancia `checkout` con un `SupabaseOrderRepository`.

---

## 2. Dominio y lógica de negocio

### Dinero: siempre integer cents, siempre con Money
```typescript
// CORRECTO
import { createMoney, multiplyMoney, addMoney } from '@saas-pos/domain';
const subtotal = multiplyMoney(createMoney(item.price, currency), quantity);

// INCORRECTO — nunca multiplicación directa para dinero
const subtotal = item.price * quantity;
```

- Toda operación monetaria usa las funciones de `packages/domain/src/value-objects/money.ts`.
- `createMoney` lanza error si se le pasa un float. Esto es intencional.
- `addMoney` valida que ambas monedas sean iguales. Si da error, el problema está en el caller.

### Moneda del tenant
La moneda (`currency`) se lee siempre del tenant, nunca se pasa manualmente por el caller.
```typescript
// CORRECTO — leerla del repo dentro del use case
const tenant = await deps.tenantRepo.findById(input.tenant_id);
const currency = tenant.currency;

// INCORRECTO — el caller no debe elegir la moneda
checkout({ ...input, currency: 'PEN' }, deps);
```

### Transiciones de estado de órdenes
Usa `ORDER_STATUS_TRANSITIONS` para validar cualquier cambio de estado.
```typescript
import { ORDER_STATUS_TRANSITIONS } from '@saas-pos/domain';
const allowed = ORDER_STATUS_TRANSITIONS[currentStatus];
if (!allowed.includes(newStatus)) throw new InvalidStatusTransitionError(...);
```

Nunca actualices `order.status` sin verificar que la transición es legal.

---

## 3. Base de datos y sincronización

### Una transacción por checkout
`SqliteOrderRepository.insertOrderWithLines()` ya incluye en su transacción:
1. INSERT en `orders`
2. INSERT en `order_lines`
3. UPDATE stock (`items SET stock = stock - ?`)

**No llames a `itemRepo.decrementStock()` después de `insertOrderWithLines()`.**
Hacerlo resulta en doble decremento. El stock se gestiona enteramente dentro de la transacción.

### Repositorios: solo persistencia
Los métodos de repositorio (`SqliteItemRepository`, `SqliteOrderRepository`, etc.) SOLO ejecutan
queries. Sin validaciones de negocio, sin llamadas a otros repos, sin lógica condicional compleja.
- **Persistencia**: Solo los archivos en `packages/db` pueden usar el cliente de Supabase directamente o SQL.
- **Tokens de Diseño**: No se permiten colores hexadecimales literales en los archivos de componentes. Usar siempre los tokens definidos en `@saas-pos/ui`.
- **Casos de Uso**: La lógica de negocio debe residir en los use cases de `packages/application`.

### JSON en SQLite
`modules_config` se almacena como TEXT en SQLite. Al leer, siempre usar try/catch:
```typescript
// CORRECTO
let modules_config: Tenant['modules_config'];
try {
  modules_config = JSON.parse(row.modules_config);
} catch {
  modules_config = { has_inventory: false, has_tables: false, has_appointments: false };
}

// INCORRECTO — crashea la app si el string está corrupto
modules_config = JSON.parse(row.modules_config);
```

### Paginación en queries de órdenes
`findByTenant` tiene un límite. Para listas largas, usar cursor-based pagination:
```typescript
// Preferir cursor sobre offset
findByTenant(tenantId: string, cursor?: string, limit = 50): Promise<Order[]>
```
Nunca retornar listas ilimitadas de órdenes.

### PowerSync schema — campos prohibidos
La tabla `users` en `powersync-schema.ts` NO debe incluir:
- `password_hash` — se sincronizaría a SQLite local de todos los dispositivos.
- Cualquier campo con PII sensible que no sea necesario para el funcionamiento offline.

Antes de agregar un campo al schema de PowerSync, preguntarse: ¿necesita estar en el dispositivo
del vendedor para que la app funcione offline? Si no, no va.

---

## 4. Seguridad

### Variables de entorno
Nunca hardcodear URLs ni keys. Usar siempre variables de entorno:
```typescript
// CORRECTO
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env vars');

// INCORRECTO
const supabase = createClient('https://xyz.supabase.co', 'eyJhbGc...');
```

Los `.env.example` de cada app documentan todas las variables requeridas. Mantenerlos actualizados.

### Validación de datos de Supabase
Al recibir datos de Supabase en la web app, validar la estructura antes de usarla:
```typescript
// Usar un esquema Zod o validación manual
const parsed = OrderSchema.safeParse(data);
if (!parsed.success) {
  console.error('Supabase returned unexpected shape', parsed.error);
  return;
}
```
Datos malformados de la red no deben llegar al domain ni persistirse en SQLite.

### Row Level Security
Cada query a Supabase en la web debe respetar el `tenant_id` del usuario autenticado.
Las políticas RLS de Supabase son la última línea de defensa, no la primera.
Filtrar siempre por `tenant_id` en el lado del cliente también.

---

## 5. TypeScript y tipado

### Sin `any`
```typescript
// INCORRECTO
const result: any = await db.getAll(...);

// CORRECTO — usar el tipo genérico del método
const result = await db.getAll<Order>(...);
```

### Naming conventions
- Variables y funciones: `camelCase`
- Componentes, clases, interfaces, tipos: `PascalCase`
- Constantes de dominio exportadas: `UPPER_SNAKE_CASE` (ej. `ORDER_STATUS_TRANSITIONS`)
- Archivos: `kebab-case.ts` para utils/domain, `PascalCase.tsx` para componentes React

### Tipos centralizados
- Entidades del dominio: `packages/domain/src/entities/`
- Value objects: `packages/domain/src/value-objects/`
- Inputs de use cases: en el propio archivo del use case
- Tipos de UI específicos de app: `apps/[app]/src/types/` (crear si no existe)

No definir tipos inline en los componentes si van a usarse en más de un lugar.

---

## 6. Design system y UI

### Tokens, no hex hardcodeados
```typescript
// CORRECTO
import { colors, spacing, typography } from '@saas-pos/ui';
const styles = StyleSheet.create({
  button: { backgroundColor: colors.accent.green, padding: spacing[4] }
});

// INCORRECTO — cualquier hex literal en un StyleSheet
const styles = StyleSheet.create({
  button: { backgroundColor: '#3ECF8E', padding: 16 }
});
```

Si `@saas-pos/ui` no tiene el token que necesitas, agregarlo al archivo `tokens.ts` primero
y luego usarlo. Nunca inventar valores inline.

### Componentes compartidos en @saas-pos/ui
Antes de crear un componente nuevo en `apps/mobile/src/components/` o `apps/web/src/components/`,
preguntarse: ¿podría usarse en la otra app? Si la respuesta es "posiblemente", crearlo en
`packages/ui/src/components/` con soporte para ambas plataformas.

### ErrorBoundary en toda pantalla nueva
Toda pantalla nueva en mobile y web debe estar envuelta en un `ErrorBoundary`.
Los errores silenciosos en producción son peores que los errores visibles.

---

## 7. Tests

### Qué testar en cada capa

| Capa | Qué testar | Dónde |
|---|---|---|
| `domain` | Reglas de negocio puras, value objects, state machine | `packages/domain/src/__tests__/` |
| `application` | Use cases con mocks de repositorios | `packages/application/src/__tests__/` |
| `db` | Repositorios SQLite con una DB en memoria | `packages/db/src/__tests__/` |
| `apps` | Hooks de React con mocks de use cases | `apps/*/src/__tests__/` |

### Umbrales mínimos de cobertura
- `packages/domain`: 50% (ya definido en jest.config.js)
- `packages/application`: 60% — especialmente checkout.ts y validate-subscription.ts
- `packages/db`: 60% — especialmente insertOrderWithLines y decrementStock
- `packages/utils`: cualquier función exportada debe tener al menos un test

### No testar infraestructura real en unit tests
Los tests unitarios no deben conectarse a Supabase ni a PowerSync.
Usar los mocks de `packages/domain/src/test-utils/builders.ts` para construir entidades.

---

## 8. Reglas específicas para el agente IA

### Antes de modificar un use case
1. Leer el contrato del port correspondiente en `packages/application/src/ports/`
2. Verificar que los tests existentes siguen pasando antes y después del cambio
3. Si el use case tiene más de 80 líneas, proponer una división antes de agregar

### Antes de modificar un repositorio SQLite
1. Verificar que la operación es atómica si toca más de una tabla
2. No agregar lógica de negocio — mover al use case si hace falta
3. Documentar si la operación tiene efectos secundarios (ej. decremento de stock)

### Antes de agregar un campo al schema de PowerSync
1. Preguntar: ¿necesita estar en el dispositivo para funcionar offline?
2. Verificar que no es PII sensible (contraseñas, tokens, datos de pago)
3. Actualizar tanto `powersync-schema.ts` como `powersync.yaml` en la misma PR

### Ante código que no escala
Si el código propuesto no es production-ready, advertirlo explícitamente con un comentario:
```typescript
// ⚠ TEMPORAL: este query no tiene paginación. Reemplazar antes de lanzar
// con cursor-based pagination cuando el volumen de órdenes supere 1000/tenant.
```

### Ante un archivo que supera 150 líneas
Proponer una división antes de agregar funcionalidad. Señales de que un archivo está saturado:
- Más de 3 responsabilidades distintas
- Más de 5 imports de distintos paquetes
- Más de 2 niveles de anidamiento en la lógica principal

---

## 9. Flujo de trabajo con git

### Convención de branches
```
feat/   — nueva funcionalidad
fix/    — corrección de bug
refactor/ — cambio sin nueva funcionalidad
chore/  — tooling, deps, documentación
```

### Un PR por fase del plan de implementación
No mezclar hotfixes de Fase 0 con refactors de Fase 2 en el mismo PR.
Los cambios de `packages/domain` siempre en PR separado — impactan todo el monorepo.

### Antes de hacer merge
- `turbo run typecheck` sin errores en todos los packages
- `turbo run test` con cobertura por encima del umbral definido en cada `jest.config.js`
- `turbo run build` exitoso end-to-end

---

*Última actualización basada en auditoría técnica de Abril 2026.*
*Mantener este archivo junto al código — si las reglas y el código divergen, actualizar el archivo.*
