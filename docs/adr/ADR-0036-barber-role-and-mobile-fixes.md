# ADR-0036 — Fix: Rol "Barbero" para usuarios y corrección de errores en Mobile

**Fecha:** 2026-05-14
**Status:** Approved
**Autor:** opencode

---

## Contexto del Problema

Se reportaron tres problemas críticos:

1. **No se pueden crear usuarios en la web:** El formulario de creación de usuarios fallaba con un error "User not allowed" al intentar crear cualquier usuario, incluso con rol de administrador.
2. **No existe opción de rol "Barbero":** Las páginas de Citas (`AppointmentsPage.tsx`) y Analytics (`AnalyticsPage.tsx`) consultan usuarios con `role = "barber"`, pero este rol nunca existió en el sistema. El rol más cercano era `staff` ("Profesional"), pero estaba excluido de la creación de usuarios.
3. **Crash en pantalla de citas del móvil:** La pantalla `appointments.tsx` en la app móvil podía crashear al recibir datos con status `completed` (del use-case) o fechas inválidas.
4. **Warning de React en órdenes del móvil:** `FilterChip` recibía `key` via spread, lo cual React 19 rechaza explícitamente.

---

## Investigación Paso a Paso

### 1. Error "User not allowed" al crear usuarios

La política RLS de INSERT en `public.users` requiere que el JWT contenga `role = 'admin'`:

```sql
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (
    tenant_id::TEXT = public.tenant_id()
    AND (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
  );
```

El hook `custom_access_token_hook` (ADR-0033/0034) inyecta el `role` desde `tenant_members`. Si el usuario no tiene un registro en `tenant_members`, el hook inyecta `role: null` y la RLS rechaza el INSERT.

**Causa raíz:** El usuario que intenta crear otros usuarios no tiene un registro en `tenant_members` con `role = 'admin'`, o el hook no está ejecutándose correctamente.

### 2. Inconsistencia del rol "barbero"

Se encontró una inconsistencia sistemática entre capas:

| Capa | Valor definido |
|------|---------------|
| `domain/entities/user.ts` | `staff` |
| `application/ports/user-repository.port.ts` | `staff` |
| `application/use-cases/manage-users.ts` | Solo `admin, cashier, waiter` (excluye `staff`) |
| `web/UserModal.tsx` | Solo `admin, cashier, waiter` (sin `staff`) |
| `web/UserTable.tsx` | `staff: "Profesional"` (existe en labels pero no en formularios) |
| `schema.sql` (users.role CHECK) | `admin, cashier, waiter, staff` |
| `schema.sql` (tenant_members CHECK) | `admin, cashier, waiter, staff` |
| `sqlite-schema.ts` (users.role CHECK) | `admin, cashier, waiter, staff` |
| `AppointmentsPage.tsx` | Consulta `role = "barber"` (no existe) |
| `AnalyticsPage.tsx` | Consulta `role = "barber"` (no existe) |

El rol `staff` existía en el schema pero estaba **bloqueado a nivel de aplicación** (use-case y UI). Las consultas de citas/analytics usaban `"barber"` que **no existía en ninguna capa**.

### 3. Crash en pantalla de citas móvil

En `appointments.tsx`:
- `STATUS_LABELS[apt.status]` fallaba cuando `status = 'completed'` (el use-case `manage-appointments.ts` usa `'completed'` pero el tipo solo aceptaba `'scheduled' | 'done' | 'cancelled'`)
- `new Date(apt.start_time).toLocaleTimeString()` lanzaba excepción si `start_time` era null o inválido

### 4. Warning React 19 con `key` en spread

En `orders.tsx`, el `key` se pasaba como `{...{ key: item[0] } as any}`, lo cual React 19 rechaza con el error:
> "A props object containing a 'key' prop is being spread into JSX"

---

## Solución y Cambios Implementados

### Fix 1: Reemplazar `staff` por `barber` en todas las capas

Se decidió estandarizar el rol como `barber` (coherente con las consultas existentes de citas/analytics) en lugar de `staff`.

#### Domain Layer
**`packages/domain/src/entities/user.ts`:**
```typescript
export type UserRole = 'admin' | 'cashier' | 'waiter' | 'barber';
```

#### Application Layer
**`packages/application/src/ports/user-repository.port.ts`:**
```typescript
export type UserRole = "admin" | "cashier" | "waiter" | "barber";
```

**`packages/application/src/use-cases/manage-users.ts`:**
```typescript
const validRoles: UserRole[] = ["admin", "cashier", "waiter", "barber"];
```
Tanto en `createUser` como en `updateUserRole`.

#### Web UI
**`apps/web/src/components/users/UserModal.tsx`:**
Se agregó la opción "Barbero" en ambos dropdowns (crear y editar):
```tsx
<option value="barber">Barbero</option>
```

**`apps/web/src/components/users/UserTable.tsx`:**
```typescript
const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  cashier: "Cajero",
  waiter: "Mesero",
  barber: "Barbero",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#3ECF8E",
  cashier: "#8B5CF6",
  waiter: "#F59E0B",
  barber: "#EC4899",
};
```

#### Database Layer
**`packages/db/src/postgres/schema.sql`:**
- `users.role CHECK`: `'admin', 'cashier', 'waiter', 'barber'`
- `tenant_members.role CHECK`: `'admin', 'cashier', 'waiter', 'barber'`

**`packages/db/src/postgres/auth-setup.sql`:**
- `tenant_members.role CHECK`: `'admin', 'cashier', 'waiter', 'barber'`

**`supabase/migrations/20260511000000_auth_hook_role_fix.sql`:**
- Se reemplazó el rol `staff` por `barber` en la creación de roles de Postgres y grants.

**`packages/db/src/schema/sqlite-schema.ts`:**
- `users.role CHECK`: `'admin', 'cashier', 'waiter', 'barber'`

#### Tests
**`packages/application/src/__tests__/manage-users.test.ts`:**
```typescript
const roles: UserRole[] = ['admin', 'cashier', 'waiter', 'barber'];
```

### Fix 2: Corrección de crash en pantalla de citas móvil

**`apps/mobile/app/(tabs)/appointments.tsx`:**

```typescript
type AppointmentStatus = 'scheduled' | 'done' | 'cancelled' | 'completed';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Programada',
  done: 'Completada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};
```

Protección contra fechas inválidas:
```typescript
const date = apt.start_time ? new Date(apt.start_time) : null;
const timeStr = date && !isNaN(date.getTime())
  ? date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  : '--:--';
const statusLabel = STATUS_LABELS[apt.status] ?? apt.status;
```

### Fix 3: Corrección de `key` en FilterChip (React 19)

**`apps/mobile/app/(tabs)/orders.tsx`:**
```tsx
// Antes:
<FilterChip {...{ key: item[0] } as any} label={item[1]} ... />

// Después:
<FilterChip key={item[0]} label={item[1]} ... />
```

Se agregó `key?: string` al tipo del componente:
```typescript
function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void; key?: string }) {
```

---

## Consecuencias

- **Creación de usuarios:** Ahora es posible crear usuarios con rol `barber` desde la interfaz web. El error "User not allowed" persiste si el usuario que crea no tiene `role = 'admin'` en `tenant_members` (esto es comportamiento correcto de RLS).
- **Consistencia de roles:** Todas las capas del sistema usan el mismo conjunto de roles: `admin`, `cashier`, `waiter`, `barber`.
- **Citas y Analytics:** Las consultas por `role = "barber"` ahora encontrarán usuarios correctamente.
- **Estabilidad móvil:** La pantalla de citas ya no crashea con datos inesperados.
- **React 19 compliance:** Eliminados los warnings de `key` en spread.

---

## Migración requerida en Supabase

Para instancias existentes con datos en `staff`, ejecutar:

```sql
-- Actualizar datos existentes
UPDATE public.users SET role = 'barber' WHERE role = 'staff';
UPDATE public.tenant_members SET role = 'barber' WHERE role = 'staff';

-- Actualar constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'cashier', 'waiter', 'barber'));

ALTER TABLE public.tenant_members DROP CONSTRAINT IF EXISTS tenant_members_role_check;
ALTER TABLE public.tenant_members ADD CONSTRAINT tenant_members_role_check 
  CHECK (role IN ('admin', 'cashier', 'waiter', 'barber'));
```

---

## Referencias

- ADR-0032: Barbershop Features Implementation
- ADR-0033: JWT Hook Role Fix
- ADR-0034: PowerSync Schema Auth Fix
- `packages/domain/src/entities/user.ts`
- `packages/application/src/use-cases/manage-users.ts`
- `apps/web/src/components/users/UserModal.tsx`
- `apps/mobile/app/(tabs)/appointments.tsx`
- `apps/mobile/app/(tabs)/orders.tsx`
