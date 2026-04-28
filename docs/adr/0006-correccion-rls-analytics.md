# ADR 0006: Corrección de RLS y Dashboards Multitenant

## Estado
Propuesto

## Contexto
El usuario reportó que la página de Analytics se quedaba "cargando" indefinidamente y que la lista de órdenes mostraba 0 resultados, a pesar de haber simulado 180 órdenes para el tenant de Don Pepe.

Tras la investigación, se identificaron dos problemas críticos:
1.  **RLS Mismatch**: La función SQL `public.tenant_id()` utilizada en las políticas de RLS solo buscaba el `tenant_id` en `jwt.claims->'tenant_id'` y `app_metadata`. Sin embargo, Supabase Auth almacena los metadatos del usuario en `user_metadata`, lo que provocaba que la función devolviera `NULL` y RLS filtrara todos los registros.
2.  **Missing Dependency**: En `AnalyticsPage.tsx`, el hook `useEffect` encargado de disparar la carga de datos tenía un array de dependencias vacío `[]`. Como el `tenantId` se resuelve de forma asíncrona, en el primer render era `null`, el efecto se ejecutaba, retornaba temprano y nunca volvía a intentarlo cuando el ID estaba disponible.

## Decisiones
1.  **Actualizar `public.tenant_id()`**: Se modificó la función para incluir `user_metadata` en el `COALESCE`.
    ```sql
    CREATE OR REPLACE FUNCTION public.tenant_id() RETURNS text ... AS $$
      SELECT COALESCE(
        ...,
        current_setting('request.jwt.claims', true)::json->'user_metadata'->>'tenant_id'
      );
    $$;
    ```
2.  **Corregir `AnalyticsPage.tsx`**: Se añadió `tenantId` al array de dependencias del `useEffect`.
3.  **Dinamizar Overview**: Se planea actualizar la página de `Overview` (actualmente estática en `App.tsx`) para que consuma datos reales y refleje el estado de conexión de Supabase/PowerSync.

## Consecuencias
- Las órdenes de Don Pepe ahora deberían ser visibles en la web.
- El dashboard de Analytics ahora cargará correctamente en cuanto se resuelva la sesión del usuario.
- Se garantiza compatibilidad con el flujo de registro estándar de Supabase que guarda el `tenant_id` en metadatos.
