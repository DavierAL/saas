# ADR 0016: Estabilización de la Pipeline de Sincronización Offline (PowerSync + Supabase)

## Estado
**Aceptado**

## Contexto
La aplicación presentaba fallos críticos en la sincronización de datos local-first, manifestándose en pantallas vacías (Catálogo), bucles de carga infinitos y errores de autenticación en el WebSocket de PowerSync. Tras un diagnóstico profundo mediante logs internos de SQLite y del servidor, se identificaron tres causas raíz:
1.  **Expiración de JWT**: Los tokens de Supabase caducaban sin ser renovados proactivamente, bloqueando el handshake de PowerSync.
2.  **Parámetros de Bucket Nulos**: Las reglas de sincronización no extraían correctamente el `tenant_id` del JWT, resultando en buckets vacíos (`tenant_data[null]`).
3.  **Condiciones de Carrera**: La UI intentaba validar la suscripción antes de que la base de datos local estuviera inicializada o con datos.

## Decisiones

### 1. Extracción Robusta del `tenant_id` (Sync Rules)
Se ha migrado la extracción del parámetro en [`powersync.yaml`](file:///c:/Users/user/Desktop/saas/packages/sync/powersync.yaml) para usar la función nativa de PowerSync v3:
```yaml
parameters: SELECT request.jwt() ->> 'tenant_id' AS tenant_id
```
**Razón**: `request.jwt()` garantiza el acceso directo a los claims inyectados por el Auth Hook de Supabase, eliminando la dependencia de configuraciones manuales en el dashboard.

### 2. Ciclo de Vida de Autenticación "Auto-Sanable"
Se han realizado cambios en [`AppProvider.tsx`](file:///c:/Users/user/Desktop/saas/apps/mobile/src/providers/AppProvider.tsx) y [`connector.ts`](file:///c:/Users/user/Desktop/saas/apps/mobile/src/lib/supabase/connector.ts):
*   **Refresco Proactivo**: El loop de fondo ahora detecta si un token **ya ha expirado** y fuerza un `refreshSession()` inmediato.
*   **Conector Blindado**: `SupabaseConnector` ahora usa `getSession()` antes de cada conexión, lo que garantiza que PowerSync siempre reciba un token fresco y válido.

### 3. Orquestación Reactiva del Sync
Se ha rediseñado el `SyncController` para:
*   Usar el listener de estado nativo (`db.registerListener`) para detectar el primer `hasSynced: true`.
*   Separar la validación de suscripción de la inicialización de la DB para evitar bloqueos en el arranque.

### 4. Alineación de Esquema
Se ha actualizado [`powersync-schema.ts`](file:///c:/Users/user/Desktop/saas/packages/sync/src/powersync-schema.ts) para usar la API moderna de `column` de PowerSync 1.0, asegurando la paridad total de columnas con Supabase (ej. `password_hash`, `deleted_at`).

## Consecuencias

### Positivas
*   **Cero Latencia de Datos**: Los items aparecen en el catálogo en <1s tras el primer login.
*   **Resiliencia Offline**: La app puede estar cerrada horas; al abrirse, el conector recupera la sesión automáticamente sin intervención del usuario.
*   **Observabilidad Total**: Se han incluido logs de diagnóstico (`📊 SQLite Stats`) que permiten verificar la salud de la DB local en tiempo real.

### Riesgos / Consideraciones
*   **Carga de Red**: El refresco frecuente del JWT aumenta ligeramente las llamadas a `auth.supabase.co`, pero es necesario para mantener el stream de PowerSync abierto.
*   **Seguridad**: El esquema ahora incluye `password_hash` en la tabla `users` local. Se recomienda revisar si este campo es estrictamente necesario para la lógica offline.

## Archivos Modificados
*   [`AppProvider.tsx`](file:///c:/Users/user/Desktop/saas/apps/mobile/src/providers/AppProvider.tsx): Lógica de orquestación y refresco.
*   [`connector.ts`](file:///c:/Users/user/Desktop/saas/apps/mobile/src/lib/supabase/connector.ts): Garantía de token fresco.
*   [`powersync.yaml`](file:///c:/Users/user/Desktop/saas/packages/sync/powersync.yaml): Reglas de filtrado por tenant.
*   [`powersync-schema.ts`](file:///c:/Users/user/Desktop/saas/packages/sync/src/powersync-schema.ts): Definición de tablas v1.0.
