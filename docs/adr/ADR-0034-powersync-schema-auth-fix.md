# ADR-0034 — Fix: PowerSync `permission denied for schema auth` y Logout en Mobile

**Fecha:** 2026-05-11
**Status:** Approved
**Autor:** opencode

---

## Contexto del Problema

Al utilizar la aplicación móvil, los usuarios reportaron dos problemas críticos:
1. **Error de sincronización (PowerSync):** Al intentar subir datos locales al backend (como la actualización de la última verificación de suscripción en la tabla `tenants`), la consola arrojaba un error `42501`: `permission denied for schema auth`. 
2. **UX de Cierre de Sesión:** Tras hacer clic en el botón de logout, la aplicación no redirigía a la pantalla de login, dejando al usuario atrapado en una vista inutilizable. Además, el botón original carecía de texto que lo hiciera obvio.

---

## Investigación Paso a Paso

### 1. Error de Permisos RLS en PostgREST (`schema auth`)
El error indicaba que durante un intento de UPSERT en `public.tenants` ejecutado por el conector de PowerSync, se denegaba el acceso al esquema `auth`. 

Tras investigar la estructura de las bases de datos y las políticas, determinamos lo siguiente:
- El hook de autenticación creado en la resolución del ADR-0033 (`custom_access_token_hook`) estaba intentando extraer el identificador del usuario utilizando `event->>'user_id'`. Sin embargo, la estructura correcta de GoTrue para los hooks de token ubica el identificador en `event->'claims'->>'sub'`.
- Como el identificador siempre resultaba `null`, el hook no encontraba el registro del usuario en `public.tenant_members`.
- Al no encontrarlo, inyectaba por defecto el rol `"none"` en la raíz de los claims del JWT.
- Cuando la aplicación móvil realizaba una petición REST a Supabase enviando este JWT, **PostgREST intentaba asumir el rol de base de datos indicado en el claim (`"none"`)**.
- Como el rol `"none"` no existe, la petición se procesaba de forma anómala (cayendo en roles sin privilegios como `anon` o generando un error interno), lo que causaba que al evaluar políticas que dependían indirectamente de `tenant_members` (la cual tiene una Foreign Key hacia `auth.users`), saltara el error `permission denied for schema auth`.

### 2. Conflicto de Roles (App vs. Postgres)
Se determinó que si corregíamos el hook para que inyectara correctamente el rol (ej. `"admin"`) en la raíz del JWT, PostgREST intentaría ejecutar la consulta haciendo un `SET ROLE admin`. Si este rol no existe nativamente en PostgreSQL, la petición REST falla por completo (con errores 500 o 403). Las RLS policies estaban esperando que la llave `role` se evaluara en la raíz de las peticiones para la lógica de negocio (`(current_setting('request.jwt.claims', true)::json->>'role') = 'admin'`).

### 3. Problema en Cierre de Sesión
El flujo del botón de "Logout" en la app dependía enteramente de los listeners de autenticación (`supabase.auth.onAuthStateChange`). Al establecerse la sesión en `null`, un efecto (useEffect) en el archivo layout raíz (`_layout.tsx`) debía redirigir al login. Sin embargo, inconsistencias en el re-renderizado o bloqueos de enrutamiento interno de Expo Router impedían que el `router.replace` se ejecutara correctamente de manera asíncrona a través de los proveedores.

---

## Solución y Cambios Implementados

### Fix 1: Corregir el Hook de Supabase (`custom_access_token_hook`)
Se corrigió la extracción del ID de usuario (`event->'claims'->>'sub'`) y se aseguró que el rol predeterminado en caso de fallo preservara el rol original (ej. `authenticated`) en lugar de sobreescribirlo a `"none"`.

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
        SELECT jsonb_build_object('tenant_id', tenant_id::text, 'role', role)
        FROM public.tenant_members
        WHERE auth_user_id = (event->'claims'->>'sub')::uuid
      ),
      jsonb_build_object('tenant_id', null, 'role', event->'claims'->>'role')
    )
  );
$body$;
```

### Fix 2: Crear los Roles de Negocio en Postgres
Para que PostgREST pueda hacer la aserción de los roles de aplicación de forma correcta sin causar fallos en la base de datos (y seguir utilizando las RLS existentes), se añadieron los roles de negocio explícitamente y se concedieron permisos de suplantación al usuario de autenticación (`authenticator`):

```sql
-- Creación de roles de negocio
CREATE ROLE admin NOLOGIN;
GRANT authenticated TO admin;
CREATE ROLE cashier NOLOGIN;
GRANT authenticated TO cashier;
CREATE ROLE waiter NOLOGIN;
GRANT authenticated TO waiter;
CREATE ROLE staff NOLOGIN;
GRANT authenticated TO staff;

-- Concesión para que el proxy de PostgREST pueda asumirlos
GRANT admin, cashier, waiter, staff TO authenticator;

-- Asegurar acceso al esquema public
GRANT USAGE ON SCHEMA public TO admin, cashier, waiter, staff;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin, cashier, waiter, staff;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO admin, cashier, waiter, staff;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO admin, cashier, waiter, staff;
```

### Fix 3: Mejoras de UX y Redirección en Mobile
En `apps/mobile/app/(tabs)/index.tsx`, se mejoró el flujo de cierre de sesión forzando la redirección inmediata, además de hacer el botón más visible agregándole la etiqueta "Salir":

```tsx
<Pressable onPress={async () => { await signOut(); router.replace('/(auth)/login'); }} style={st.logoutBtn}>
  <Ionicons name="log-out-outline" size={22} color={colors.status.error} />
  <Text style={{color: colors.status.error, fontSize: 10, marginLeft: 2, fontWeight: 'bold'}}>Salir</Text>
</Pressable>
```

---

## Consecuencias
- La sincronización mediante PowerSync funciona correctamente para todos los perfiles, sin encontrarse con errores de acceso a esquemas protegidos (`auth`).
- Las políticas RLS a nivel de la aplicación siguen evaluando la jerarquía de `tenant_id` y `role` de manera segura, pero sin romper la capa REST.
- Los usuarios de la app móvil ahora pueden cerrar sesión y navegar exitosamente a la pantalla de login sin quedarse bloqueados.

---

## Referencias
- ADR-0034: Este documento (fix del hook y roles)
- ADR-0035: Fix RLS Policies para `tenants` y Sincronización PowerSync (políticas de tabla)
- `supabase/migrations/20260511000000_auth_hook_role_fix.sql` - Archivo migratorio que contiene los fixes y roles de PostgREST.
- `apps/mobile/app/(tabs)/index.tsx` - Componente UI con el botón de logout mejorado.
