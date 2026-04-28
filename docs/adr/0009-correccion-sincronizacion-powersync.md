# ADR 0009: Corrección de Sincronización PowerSync (Falta de datos en Móvil)

## Estado
Aceptado

## Contexto
El usuario reportó que, tras iniciar sesión en la aplicación móvil con las credenciales de prueba (`donpepe@saas.com`), no se visualizaban los datos (inventario, órdenes) que sí eran visibles en la plataforma web.

La investigación técnica reveló que:
1.  **Aislamiento de Datos:** PowerSync utiliza reglas de sincronización basadas en buckets filtrados por `tenant_id`.
2.  **Origen del ID:** El `tenant_id` se extrae del token JWT del usuario mediante un hook de Supabase (`custom_access_token_hook`).
3.  **Fallo de Inyección:** Dicho hook consulta la tabla `public.tenant_members` para asociar el `user_id` de Auth con su respectivo negocio.
4.  **Causa Raíz:** La tabla `public.tenant_members` estaba vacía. Aunque el usuario existía en `public.users` y tenía el `tenant_id` en su `user_metadata`, el motor de PowerSync no podía resolver el bucket correctamente al faltar el claim en el nivel superior del JWT definido por el hook.

## Decisión
Se procedió a la reconciliación de la infraestructura de acceso:
1.  **Poblamiento de Membresías:** Se insertó el registro de `donpepe@saas.com` en `public.tenant_members` vinculándolo con el tenant "Bodega Don Pepe" (`d86874dd-0418-4cf6-929c-0afe3cee82f9`).
2.  **Validación del Hook:** Se verificó mediante simulación SQL que el hook de JWT ahora inyecta correctamente los claims `tenant_id` y `role` en el token de acceso.
3.  **Persistencia:** Se mantiene la compatibilidad con la web (que usa el fallback de metadata) mientras se habilita el requerimiento estricto de PowerSync para el cliente móvil.

## Consecuencias
- **Positivas:** La aplicación móvil ahora puede autenticarse en PowerSync con un token válido que identifica su "bucket" de datos, permitiendo la descarga local de la base de datos SQLite.
- **Riesgo:** Los usuarios que ya tenían una sesión iniciada antes de este cambio deben **cerrar sesión y volver a entrar** para obtener un nuevo JWT que incluya los claims corregidos.

## Procedimiento de Verificación
1.  **SQL Check:** `SELECT * FROM public.tenant_members;` retorna 1 fila para Don Pepe.
2.  **JWT Simulation:** La consulta de prueba confirma que el claim `tenant_id` está presente en el objeto `claims`.
