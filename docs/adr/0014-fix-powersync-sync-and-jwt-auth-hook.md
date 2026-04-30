# ADR 0014: Corrección de Sincronización PowerSync y Estructura de JWT via Auth Hooks

## Estado
Aceptado

## Contexto
La aplicación móvil POS presentaba un estado persistente de `hasSynced: false`, lo que impedía que los datos de Supabase se descargaran al SQLite local. Tras el diagnóstico, se identificaron tres causas raíz:
1.  **Sintaxis de PowerSync Obsoleta**: El archivo `powersync.yaml` utilizaba `streams` con una función inexistente (`auth.parameter()`), lo que resultaba en conjuntos de datos vacíos.
2.  **Claims de JWT Anidados**: PowerSync requiere que el `tenant_id` esté en la raíz del payload del JWT para ser leído eficientemente como parámetro de bucket, pero Supabase lo entrega anidado en `app_metadata`.
3.  **Conflictos de Dependencias**: El bundler de Expo fallaba al iniciar debido a un conflicto de versiones entre los tipos de React 19 y dependencias con peer-dependencies estrictas en React 18.
4.  **Error 500 en Edge Functions**: La función de validación de suscripción fallaba por inconsistencias en la verificación de JWT y variables de entorno.

## Decisiones

### 1. Refactorización de Reglas de Sincronización
Se actualizó [`packages/sync/powersync.yaml`](file:///c:/Users/user/Desktop/saas/packages/sync/powersync.yaml) adoptando la estructura de `bucket_definitions` (Edition 3).

```yaml
bucket_definitions:
  tenant_data:
    parameters: SELECT token_parameters.tenant_id AS tenant_id
    data:
      - SELECT * FROM public.tenants WHERE id::text = bucket.tenant_id
      - SELECT * FROM public.users WHERE tenant_id::text = bucket.tenant_id AND deleted_at IS NULL
      - SELECT * FROM public.items WHERE tenant_id::text = bucket.tenant_id AND deleted_at IS NULL
      - SELECT * FROM public.orders WHERE tenant_id::text = bucket.tenant_id AND deleted_at IS NULL
      # ... otras tablas filtradas por bucket.tenant_id
```

### 2. Implementación de Supabase Auth Hook
Se creó una función PostgreSQL [`custom_access_token_hook`](file:///c:/Users/user/Desktop/saas/supabase/migrations/20260430000000_auth_hook.sql) para inyectar el `tenant_id` en la raíz del JWT.

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql as $$
declare
  tenant_id text;
begin
  tenant_id := event->'claims'->'app_metadata'->>'tenant_id';
  if tenant_id is not null then
    event := jsonb_set(event, '{claims,tenant_id}', to_jsonb(tenant_id));
  end if;
  return event;
end;
$$;
```

### 3. Resolución de Conflictos NPM (React 19)
Se ajustó la configuración de paquetes para permitir la convivencia de tipos de React 19 con librerías legadas.
- **.npmrc**: `legacy-peer-deps=true`
- **package.json**: Sincronización de `@types/react` y `@types/react-dom` a la versión `~19.1.0`.

### 4. Control de Concurrencia en SQLite
Se reforzó el patrón de **Singleton Promise** en `initDatabase` ([`database.ts`](file:///c:/Users/user/Desktop/saas/apps/mobile/src/lib/powersync/database.ts)).

```typescript
let _initPromise: Promise<PowerSyncDatabase> | null = null;

export const initDatabase = async (): Promise<PowerSyncDatabase> => {
  if (_initialized) return getDatabase();
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const db = getDatabase();
      await db.init();
      await db.connect(getConnector());
      _initialized = true;
      return db;
    } catch (error) {
      _initPromise = null; // Permite reintento en caso de fallo
      throw error;
    }
  })();
  return _initPromise;
};
```

## Consecuencias

### Positivas
- **Sincronización Exitosa**: El móvil ahora descarga datos correctamente (`hasSynced: true`).
- **Arquitectura Escalable**: El uso de buckets parametrizados garantiza aislamiento total entre tenants.
- **Entorno Estable**: El bundler de Expo inicia sin errores de tipos.

### Negativas
- **Dependencia de Configuración Manual**: Requiere activación manual del hook en el Dashboard de Supabase.
- **Bypass de Peer-Deps**: Requiere vigilancia de compatibilidad futura en el árbol de dependencias.
