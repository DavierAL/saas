# ADR-0033 — Fix: JWT Hook no inyecta `role` → Admin no puede crear usuarios

**Fecha:** 2026-05-11
**Status:** Proposed
**Autor:** opencode

---

## Contexto del Problema

Un usuario con rol `admin` de una barbería (tenant `barbershop`) no podía crear nuevos usuarios desde la interfaz web. La app mostraba el error:

> **"User not allowed"**

El flujo de creación de usuarios en la web usa:
1. `useUsers.createUser()` en `apps/web/src/hooks/useUsers.ts`
2. Que a su vez llama a `useCases.users.createUser()` en `packages/application/src/use-cases/manage-users.ts`
3. Que finalmente inserta en `public.users` (tabla de perfiles a nivel de app) via `SupabaseUserRepository.insert()`

### Árbol de llamadas

```
UsersPage.tsx (UI)
  └── useUsers(tenantId).createUser(formData)
        └── useCases.users.createUser(input, tenantId, repo, deps)
              └── repo.insert({ email, passwordHash, role, tenantId })
                    └── INSERT INTO public.users (RLS activo)
```

### Investigación paso a paso

#### Paso 1 — Buscar el texto del error
Grepeé todo el codebase buscando `"User not allowed"`, `not allowed`, `allowedDismiss`. No encontré ninguna cadena literal con ese texto en código fuente.

```
$ grep -r "not allowed" --include="*.ts" --include="*.tsx"
→ 0 resultados en código fuente
```

Esto sugirió que el mensaje no viene de una cadena hardcodeada en la app, sino que es un mensaje de **Supabase/Postgres RLS**.

#### Paso 2 — Revisar el RLS de `public.users`
Leí `packages/db/src/postgres/rls-policies-v2.sql` y encontré la policy de INSERT para usuarios:

```sql
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (
    tenant_id::TEXT = public.tenant_id()
    AND (current_setting('request.jwt.claims', true)::json->>'role') = 'admin'
  );
```

La policy requiere **dos condiciones simultáneas**:
1. `tenant_id` del JWT coincide con `tenant_id` de la fila a insertar
2. `role` en el JWT debe ser `'admin'`

#### Paso 3 — Rastrear de dónde viene `role` en el JWT
Busqué en el código qué hook de autenticación inyecta `role` en el token. Encontré **dos versiones del hook**:

**Versión vieja** (`supabase/migrations/20260430000000_auth_hook.sql`):
```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  tenant_id text;
BEGIN
  tenant_id := event->'claims'->'app_metadata'->>'tenant_id';
  if tenant_id is not null then
    event := jsonb_set(event, '{claims,tenant_id}', to_jsonb(tenant_id));
  end if;
  return event;
END;
$$;
```
→ Solo inyecta `tenant_id`. **NO inyecta `role`.**

**Versión nueva** (`packages/db/src/postgres/auth-setup.sql`):
```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $body$
  SELECT jsonb_set(
    event,
    '{claims}',
    (event->'claims') || COALESCE(
      (
        SELECT jsonb_build_object(
          'tenant_id', tenant_id::text,
          'role', role          -- ← AQUÍ ESTÁ EL ROLE
        )
        FROM public.tenant_members
        WHERE auth_user_id = (event->>'user_id')::uuid
      ),
      jsonb_build_object('tenant_id', null, 'role', 'none')
    )
  );
$body$;
```
→ Inyecta tanto `tenant_id` como `role` desde `tenant_members`.

#### Paso 4 — Diagnóstico final

| Componente | Estado |
|-----------|--------|
| `tenant_members` tiene el admin con `role = 'admin'` | ✅ Correcto |
| RLS de `public.users` requiere `role = 'admin'` en JWT | ✅ Correcto |
| Hook JWT inyecta `role` en el token | ❌ **NO — usa la versión vieja** |

**La causa raíz:** El hook viejo (migración `20260430000000_auth_hook.sql`) solo inyecta `tenant_id` en el JWT, pero **no inyecta `role`**. Entonces la condición RLS `(current_setting('request.jwt.claims', true)::json->>'role') = 'admin'` siempre retorna `false` (porque `role` es `null` o `none` en el token), y Supabase rechaza el INSERT con un error de RLS que en algún punto muestra o deriva en "User not allowed".

#### Paso 5 — Problema secundario (users table)

Además, el usuario admin probablemente **no existe en `public.users`** (la tabla de perfiles de la app), solo en `auth.users` (autenticación) y `tenant_members` (mapping). Estas son dos tablas separadas:

- `auth.users` — maneja autenticación (login, passwords, sesiones)
- `public.users` — maneja perfiles de la app (roles POS, tenant association)
- `tenant_members` — mapea `auth.users` → `tenants` con rol

Sin un registro en `public.users`, el admin no puede operar correctamente a nivel de aplicación, aunque pueda loguearse.

---

## Decisión

**Se reemplaza** el hook `custom_access_token_hook` por la versión nueva que inyecta `role`, y se asegura que el admin exista en `public.users`.

---

## Solución

### Fix 1: Actualizar el JWT Hook

Ejecutar en Supabase Dashboard → SQL Editor:

```sql
-- ============================================================
-- Fix: Actualizar custom_access_token_hook
-- para inyectar 'role' desde tenant_members
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $body$
  SELECT jsonb_set(
    event,
    '{claims}',
    (event->'claims') || COALESCE(
      (
        SELECT jsonb_build_object(
          'tenant_id', tenant_id::text,
          'role', role
        )
        FROM public.tenant_members
        WHERE auth_user_id = (event->>'user_id')::uuid
      ),
      jsonb_build_object('tenant_id', null, 'role', 'none')
    )
  );
$body$;

-- Permisos (reemplazar los grants de la versión vieja)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

### Fix 2: Asegurar que el admin exista en `public.users`

Ejecutar en Supabase Dashboard → SQL Editor (reemplazando el email):

```sql
-- ============================================================
-- Fix: Asegurar que el admin de la barbería exista
-- tanto en auth.users como en public.users
-- ============================================================

DO $$
DECLARE
  v_auth_id UUID;
  v_tenant_id UUID;
  v_email TEXT := 'tu-email-de-admin@ejemplo.com';
BEGIN
  -- Buscar auth_user_id y tenant_id del admin
  SELECT au.id, tm.tenant_id
  INTO v_auth_id, v_tenant_id
  FROM auth.users au
  JOIN public.tenant_members tm ON tm.auth_user_id = au.id
  WHERE au.email = v_email
    AND tm.role = 'admin'
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    RAISE NOTICE 'Admin no encontrado. Verificá el email en la variable v_email.';
    RETURN;
  END IF;

  -- Verificar si ya existe en public.users
  IF EXISTS (SELECT 1 FROM public.users WHERE email = v_email) THEN
    RAISE NOTICE 'Admin ya existe en public.users.';
  ELSE
    -- Insertar en public.users (app-level)
    INSERT INTO public.users (id, email, role, tenant_id)
    VALUES (v_auth_id, v_email, 'admin', v_tenant_id);
    RAISE NOTICE 'Admin insertado en public.users con role=admin.';
  END IF;
END;
$$;
```

### Paso final: Re-autenticarse

Después de correr ambos scripts:
1. Hacer **logout** del usuario admin
2. Hacer **login** nuevamente

Esto fuerza a Supabase a generar un nuevo JWT con el hook actualizado, incluyendo `role: 'admin'` en los claims.

---

## Consecuencias

- Los JWT generados a partir de ese momento incluirán `role` inyectado desde `tenant_members`
- Los admins podrán crear, editar y gestionar usuarios dentro de su tenant
- Los cashiers y waiters seguirán sin poder crear usuarios (RLS lo bloquea)
- No afecta la autenticación ni el login

---

## Referencias

- `packages/db/src/postgres/auth-setup.sql` — versión correcta del hook
- `packages/db/src/postgres/rls-policies-v2.sql` — policy que requiere `role = 'admin'`
- `packages/db/src/postgres/schema.sql` — definición de `public.users`
- `supabase/migrations/20260430000000_auth_hook.sql` — versión vieja (problemática)
- `supabase/migrations/fix-admin-users-table.sql` — script de fix guardado en el repo
