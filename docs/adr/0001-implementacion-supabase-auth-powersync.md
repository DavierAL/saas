# ADR 0001: Implementación de Autenticación Real con Supabase y PowerSync

## Fecha
26 de Abril, 2026

## Contexto y Problema
El `AuthGuard` de la aplicación web estaba haciendo un bypass hardcodeado permitiendo el acceso sin una sesión válida. Debido a esto, al no existir una sesión JWT real, el sistema de Row Level Security (RLS) de Postgres bloqueaba la lectura y escritura de los datos reales del tenant. Además, la sincronización de PowerSync fallaba en su autenticación contra Supabase porque carecía del token de acceso (`access_token`) correcto en el frontend.

Se requería un flujo real de Login/Logout y control de sesión estricto en ambos clientes (Web y Mobile) para garantizar que la inicialización de la base de datos de PowerSync ocurriera única y exclusivamente cuando hubiera un usuario autenticado de forma exitosa.

## Decisiones Arquitectónicas

1. **Uso del Token JWT de Supabase como Bearer Token**
   - El token devuelto por `supabase.auth.getSession()` contiene los claims (`tenant_id`, `role`) necesarios para la RLS.
   - Decidimos inyectar directamente `session.access_token` en el `SupabaseConnector` de PowerSync. Con esto, toda mutación (Upsert/Patch/Delete) y sincronización (Pull) hacia la base de datos pasará forzosamente por las validaciones de seguridad de Supabase.

2. **Bloqueo de Inicialización de PowerSync (AppProvider)**
   - Modificamos el ciclo de vida de la aplicación móvil en el `AppProvider`. El componente `<DatabaseProvider />` encargado de iniciar SQLite e invocar a PowerSync **sólo se monta** si `activeSession` y `tenantId` existen. Si el usuario cierra sesión, el proveedor se desmonta y detiene las operaciones.

3. **Guardián de Rutas Estricto en la Web (`AuthGuard`)**
   - En lugar de imprimir advertencias (`console.warn`), implementamos un bloqueo en firme.
   - El nuevo `AuthGuard` usa estado asíncrono para suscribirse a `onAuthStateChange`. Mientras carga, no renderiza nada (`null`). Una vez finalizada la carga, si la sesión es inexistente o inválida, redirige inmediatamente a la página de login usando `<Navigate to="/login" replace />`.

4. **Desacoplamiento de la Ruta Pública (`/login`)**
   - En `App.tsx`, se reestructuró el enrutador anidado. La ruta de login se ubica en el tope de la jerarquía **fuera** de `AuthGuard`. El layout principal (Menú Lateral y Cabecera) se ubica dentro de un comodín `/*` que sí está envuelto por el `AuthGuard`.

5. **Estandarización de UX en Errores de Login**
   - Para evitar revelar información técnica sensible (e.g., si el correo existe o no en la base de datos) y mejorar la claridad para el usuario final, toda credencial incorrecta o fallo de sesión en ambos clientes (Web y Mobile) retorna estrictamente el mensaje: `"Correo o contraseña incorrectos"`.

## Procedimiento de Implementación Realizado

1. **Mobile:**
   - Se creó el hook compartido `apps/mobile/src/hooks/useSession.ts` que retorna `{ session, user, loading, signOut }`.
   - Se modificó `apps/mobile/app/(auth)/login.tsx` para atrapar cualquier error de `signInWithPassword`, mostrar el texto genérico, y redirigir con `router.replace('/(tabs)')` bajo éxito.
2. **Web:**
   - Se reescribió `apps/web/src/components/AuthGuard.tsx` con la validación estricta de sesión.
   - Se creó el componente UI de autenticación `apps/web/src/pages/LoginPage.tsx` utilizando la API de Supabase Auth.
   - Se ajustó `apps/web/src/App.tsx` para albergar la vista pública del Login sin mostrar los componentes del Dashboard.
3. **Validación Existente:**
   - Se verificó que `AppProvider.tsx` y `connector.ts` en `apps/mobile` ya contuvieran y aplicaran las reglas arquitectónicas mencionadas, validando el correcto uso del JWT y bloqueando correctamente a los usuarios sin sesión en PowerSync.

## Consecuencias
- **Positivas:** La seguridad de los datos ahora está respaldada de extremo a extremo. Los clientes sin sesión no pueden leer el layout web principal ni descargar la base de datos a su dispositivo móvil. El RLS de Supabase funciona de la manera esperada al recibir el Bearer Token.
- **Negativas / Riesgos:** Los usuarios que cierren la aplicación móvil o web repentinamente deberán confiar en la persistencia del cliente de Supabase (el cual usa LocalStorage/AsyncStorage por defecto) para mantenerse dentro; si se limpia la caché local, la sesión se cerrará obligando al usuario a re-autenticarse con sus credenciales.
