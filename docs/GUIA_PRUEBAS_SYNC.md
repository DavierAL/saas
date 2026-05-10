# Guía de Pruebas: Estabilización de Sincronización Móvil

Sigue estos pasos para verificar que el sistema de sincronización y validación de suscripciones está funcionando correctamente tras las correcciones aplicadas.

## Paso 1: Actualizar Reglas en PowerSync (CRÍTICO)

Para que el dispositivo pueda descargar los productos y datos del tenant, las reglas del servidor deben coincidir con los cambios en el código.

1.  Abre tu consola de **PowerSync Dashboard**.
2.  Ve a la sección **Sync Rules**.
3.  Copia y pega el contenido de tu archivo local: `packages/sync/powersync.yaml`.
4.  Haz clic en **Deploy** o **Save Changes**.

## Paso 2: Desplegar la Edge Function (Recomendado)

Aunque el sistema tiene un "fallback" a base de datos directa, es mejor que la función funcione correctamente para evitar advertencias de error 500 en los logs.

1.  Abre una terminal en la raíz del proyecto.
2.  Ejecuta el siguiente comando:
    ```powershell
    supabase functions deploy validate-subscription --no-verify-jwt
    ```

## Paso 3: Reinicio Limpio de la Aplicación

Debido a que hemos cambiado la estructura de inicialización de la base de datos, es recomendable reiniciar el emulador para limpiar cualquier estado inconsistente.

1.  Detén el proceso actual de `npm run android` (Ctrl + C).
2.  Inicia la app nuevamente:
    ```powershell
    npx expo start --android --clear
    ```
    *(La bandera `--clear` asegura que el bundle de JS se refresque totalmente).*

## Paso 4: Verificación de Logs

Una vez que la app inicie y te loguees con `donpepe.final@saas.com`, observa los logs en la terminal. Deberías ver esta secuencia exitosa:

1.  `[PowerSync] Starting initialization...`
2.  `[PowerSync] Connecting to backend...`
3.  `[SupabaseRemoteValidator] DB fallback succeeded` (o `Edge function success` si desplegaste el paso 2).
4.  `[SyncController] Status Change: Connected (hasSynced: true)` — **Este es el punto clave.**

## Paso 5: Prueba Funcional en el Catálogo

1.  Navega a la pantalla de **Catálogo**.
2.  Deberías ver los **50 items** (Coca Cola, Leche Gloria, etc.) que confirmamos existen para el tenant "Bodega Don Pepe".
3.  Intenta agregar un item al carrito. Si el carrito se actualiza, la base de datos SQLite local está operativa.

---

### ¿Qué pasa si sigue vacío?
Si `hasSynced` es `true` pero el catálogo sigue vacío, verifica en el Dashboard de PowerSync que el usuario tenga asignado el `tenant_id` correcto en sus claims de JWT. Puedes verlo en los logs de la app donde imprimimos `[JWT] Payload`.
