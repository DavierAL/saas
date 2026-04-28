# ADR-010: Diagnóstico del Catálogo Vacío — PowerSync Sync Streams + isLoading Race Condition

**Estado:** Aprobado  
**Fecha:** 2026-04-28  
**Contexto:** SaaS POS — App Móvil (Expo + PowerSync + Supabase)

---

## Contexto del problema

Después de que el usuario iniciaba sesión correctamente, la pantalla de Catálogo se quedaba permanentemente en el estado de "Loading Skeleton". Los datos nunca cargaban. El panel de PowerSync no tenía Sync Streams configurados.

---

## Síntomas iniciales

Al revisar los logs del dispositivo Android:

```
LOG  [JWT] Extracted claim 'tenant_id': d86874dd-0418-4cf6-929c-0afe3cee82f9
LOG  [SupabaseConnector] Fetching credentials...
LOG  [SupabaseConnector] Credentials fetched successfully. Token present: true
WARN Trying to close for the second time.
LOG  [SupabaseConnector] Fetching credentials...
... (se repite indefinidamente)
LOG  [SyncController] Remote validation finished. Status: Invalid
```

**Observaciones iniciales:**

1. La autenticación funcionaba (JWT correcto, `tenant_id` extraído).
2. PowerSync se conectaba pero inmediatamente volvía a intentarlo.
3. El aviso `Trying to close for the second time` indicaba que la conexión se cerraba antes de completarse.
4. La validación remota retornaba HTTP 400.
5. La UI nunca salía del skeleton.

---

## Proceso de diagnóstico — Árbol de causas

### Hipótesis 1: Los Sync Streams no están configurados (CORRECTA)

**Razonamiento:** PowerSync necesita Sync Streams para saber qué tablas replicar a qué usuarios. Sin ellos, no hay datos. El panel confirmó "No Sync Streams Deployed Yet".

**Acción:** Configurar `packages/sync/powersync.yaml` con la sintaxis correcta de Edition 3.

**Obstáculo:** Cuatro intentos de sintaxis fallaron con diferentes errores del validador del dashboard:

| Intento | Sintaxis | Error |
|---------|----------|-------|
| 1 | `request.jwt() -> 'user_metadata' ->> 'tenant_id'` | `Invalid schema in function name` |
| 2 | `auth.jwt() -> 'user_metadata' ->> 'tenant_id'` | `Unknown request function` |
| 3 | `auth.data() -> 'user_metadata' ->> 'tenant_id'` | `Unknown request function` |
| 4 ✅ | `auth.parameter('user_metadata') ->> 'tenant_id'` | Sin errores |

**Conclusión de sub-investigación:** La documentación web que encontré (incluyendo resultados de búsqueda de Google) referenciaba funciones incorrectas o desactualizadas. La función real en PowerSync Sync Streams Edition 3 es `auth.parameter('<claim_name>')`. Esto lo descubrió el usuario mediante prueba directa en el dashboard.

**Resultado:** Sync Streams desplegados exitosamente. Dashboard muestra "Sync Rules: 1 (5254)" y estado "Active".

---

### Hipótesis 2: El skeleton persiste por una race condition en `isLoading` (CORRECTA)

**Razonamiento:** Con los Sync Streams activos, el skeleton debería desaparecer. Pero seguía ahí. Revisé el código:

```tsx
// apps/mobile/app/(tabs)/index.tsx
const isLoading = status === 'connecting' && rawItems.length === 0;
```

Esta condición dice: "muestra el skeleton mientras `status` sea `'connecting'` Y no haya items".

**Problema:** PowerSync estaba en un bucle de reconexión (`'connecting'` → falla → `'connecting'` → ...), así que `status` **nunca** llegaba a `'connected'`. La condición `isLoading` era permanentemente `true`.

**¿Por qué el bucle de reconexión?** Aquí empecé a investigar el siguiente nivel.

---

### Hipótesis 3: `initDatabase()` se llamaba múltiples veces (PARCIALMENTE CORRECTA)

**Razonamiento:** El WARN `Trying to close for the second time` en PowerSync ocurre cuando `db.connect()` o `db.disconnect()` se llama mientras la base de datos ya está en proceso de conectarse o desconectarse.

**Evidencia:** `SyncController` en `AppProvider` tiene un `useEffect([tenantId])` que llama `initDatabase()`. Si `AppProvider` re-renderiza y `tenantId` cambia (porque se recalcula en cada render desde el JWT), el `useEffect` se dispara múltiples veces.

**Acción:** Hacemos `initDatabase()` idempotente con un flag `_initialized`:

```typescript
let _initialized = false;

export const initDatabase = async (): Promise<PowerSyncDatabase> => {
  const db = getDatabase();
  if (_initialized) return db; // ← Evita doble connect
  const connector = getConnector();
  await db.init();
  await db.connect(connector);
  _initialized = true;
  return db;
};
```

**Resultado:** El WARN persistió. Esto confirmó que `initDatabase()` no era la única causa del bucle.

---

### Hipótesis 4: Discrepancia de esquema entre PowerSync y Supabase (CORRECTA — causa raíz del bucle)

**Razonamiento:** Si el servidor de PowerSync intenta ejecutar una query con una columna que no existe en Postgres, la query falla. PowerSync interpreta este fallo como un error de sincronización y reintenta la conexión indefinidamente.

**Investigación:** Consulté directamente la tabla en Supabase:

```sql
SELECT * FROM public.tenants LIMIT 1;
```

El resultado no incluía la columna `last_remote_validation_at`. Pero en `packages/sync/src/powersync-schema.ts`:

```typescript
const tenants = new Table({
  // ...
  last_remote_validation_at: { type: ColumnType.TEXT }, // ← EXISTÍA EN EL ESQUEMA
  // ...
});
```

Y en `packages/db/src/sqlite/repositories/tenant-repository.ts`, la columna era activamente usada en SELECTs y UPDATEs.

**Decisión de diseño:** En lugar de eliminar la columna del código (lo que hubiera roto la lógica de validación de suscripción offline), añadimos la columna a Supabase:

```sql
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS last_remote_validation_at TIMESTAMPTZ DEFAULT NULL;
```

**Resultado:** La columna ahora existe en ambos lados. La query de PowerSync debería completarse correctamente.

---

### Hipótesis 5: El skeleton sigue visible aunque haya datos (FIX FINAL)

**Razonamiento:** Incluso si el bucle de reconexión se reduce, PowerSync puede estar en estado `'connecting'` mientras realiza el sync inicial. La condición original:

```tsx
const isLoading = status === 'connecting' && rawItems.length === 0;
```

...mostraría el skeleton durante todo el tiempo que el primer sync tarda en completarse, y si hay cualquier reintento posterior, volvería al skeleton aunque ya haya datos locales.

**La solución correcta usa `hasSynced`:**

```tsx
// NUEVA lógica — local-first correcta:
// - Solo muestra skeleton si NUNCA ha completado un sync Y no hay datos locales.
// - Una vez que hasSynced=true, nunca más vuelve al skeleton aunque reconecte.
const isLoading = !hasSynced && rawItems.length === 0 && status !== 'disconnected';
```

**Por qué `hasSynced` es el indicador correcto:**
- `hasSynced` es un flag persistente que PowerSync establece en `true` después del primer ciclo de sincronización exitoso.
- Es consistente con la arquitectura local-first: después de una sync, los datos existen en SQLite. Los renders posteriores deben leer de SQLite directamente, sin esperar reconexiones de red.
- Evita el anti-patrón de bloquear la UI en espera del estado de la red.

---

## Verificación final

**Datos en Supabase para el tenant del usuario de prueba:**

```sql
SELECT u.email, (u.raw_user_meta_data->>'tenant_id') as jwt_tenant_id, COUNT(i.id) as item_count
FROM auth.users u
LEFT JOIN public.items i ON i.tenant_id = (u.raw_user_meta_data->>'tenant_id')::uuid
GROUP BY u.email, u.raw_user_meta_data;

-- Resultado: donpepe@saas.com → tenant d86874dd → 5 items
```

Los datos existen. El flujo correcto de sync los traerá al SQLite local.

---

## Decisiones tomadas

### D1 — Sintaxis oficial de PowerSync Edition 3 para JWT

```yaml
auth.parameter('<claim_name>') ->> '<nested_key>'
```

**Motivo de rechazo de alternativas:**
- `request.jwt()` → pertenece al sistema de Sync Rules legacy (Edition < 3).
- `auth.jwt()` / `auth.data()` → no existen como funciones en el contexto de Sync Stream queries.

### D2 — `initDatabase()` idempotente

Agregar flag `_initialized` en el módulo singleton. Alternativa descartada: mover la llamada a `connect()` fuera de `initDatabase()` y hacerla parte de un hook React — aumenta acoplamiento sin beneficio.

### D3 — Añadir columna faltante a Supabase (no eliminar del código)

La columna `last_remote_validation_at` es parte de la lógica de negocio (validación de suscripción offline). Eliminarla del código hubiera requerido un refactor mayor de `SqliteTenantRepository` y `ITenantRepositoryPort`. En cambio, añadir la columna a Supabase es un cambio aditivo, backward-compatible, y no destructivo.

### D4 — Usar `hasSynced` como indicador de loading (no `status === 'connecting'`)

`hasSynced` es el único indicador semánticamente correcto para "¿ya tengo datos locales?". El estado de conexión de red es irrelevante para mostrar datos que ya existen en SQLite. Este patrón es el estándar en arquitecturas local-first.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `packages/sync/powersync.yaml` | Migración a Edition 3 con `auth.parameter()` y `auto_subscribe: true` |
| `apps/mobile/src/lib/powersync/database.ts` | `initDatabase()` idempotente con `_initialized` flag |
| `apps/mobile/app/(tabs)/index.tsx` | `isLoading` usa `hasSynced` en lugar de `status === 'connecting'` |
| Supabase `public.tenants` | Añadida columna `last_remote_validation_at TIMESTAMPTZ` |

---

## Consecuencias

**Positivas:**
- El catálogo carga en cuanto se completa el primer sync (incluso con reconexiones posteriores).
- `initDatabase()` es seguro de llamar desde cualquier punto del ciclo de vida.
- El esquema de PowerSync y Supabase son consistentes.

**Negativas / Riesgos:**
- El flag `_initialized` es a nivel de módulo JS — si React Native recarga el módulo (hot reload agresivo), el flag se resetea y `connect()` se llamará nuevamente. Esto es aceptable en desarrollo; en producción no ocurre.
- La Edge Function `validate-subscription` sigue retornando HTTP 400. La app continúa con datos locales (comportamiento correcto para local-first), pero la validación de suscripción remota está degradada. Requiere investigación separada.

---

## Pendientes

- [ ] Investigar el HTTP 400 de `validate-subscription`: revisar si el JWT lleva los claims que la función espera en su body.
- [ ] Agregar un test de integración que valide que `hasSynced` transiciona a `true` después del primer sync exitoso.
- [ ] Considerar persistir `hasSynced` en `AsyncStorage` para que sobreviva reinicios de la app.
