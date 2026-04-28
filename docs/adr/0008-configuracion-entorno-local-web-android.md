# ADR-0008: Configuración del Entorno de Desarrollo Local — Web y Android

**Estado:** Aceptado  
**Fecha:** 2026-04-28  
**Autor:** Equipo SaaS POS (via Antigravity)  
**Contexto:** Configuración inicial del entorno de desarrollo en Windows para los proyectos `apps/web` (Vite + React) y `apps/mobile` (Expo + React Native + Android)

---

## Contexto y Problema

Al intentar inicializar el entorno de desarrollo en una máquina Windows por primera vez, tanto la aplicación web como la aplicación móvil fallaban al arrancar. Los errores eran múltiples, encadenados y provenían de capas diferentes del stack (build nativo, variables de entorno, inicialización de módulos y hooks de React).

---

## Problemas Encontrados y Soluciones Aplicadas

### 1. Build Android Local en Windows — EAS CLI no compatible

**Error:**
```
Unsupported platform, macOS or Linux is required to build apps for Android
Error: build command failed.
```

**Causa:** `eas build --local` no soporta Windows. El build local de EAS requiere macOS o Linux.

**Solución:** Migrar al flujo nativo de Expo:
```bash
npx expo run:android
```
Este comando compila directamente con Gradle y las herramientas de Android SDK instaladas localmente, sin depender de EAS CLI.

**Archivos afectados:** Ninguno (cambio de comando).

---

### 2. NDK — Error de Compilación C++ (`std::format`)

**Error:** Fallo de compilación C++ durante el build de Gradle con NDK.

**Causa:** La versión de NDK disponible en el sistema no era compatible con las directivas C++20 usadas por algunos módulos nativos.

**Solución:** Fijar explícitamente la versión del NDK en `apps/mobile/android/app/build.gradle`:
```groovy
android {
    ndkVersion = "27.0.12077973"
    ...
}
```

**Archivos afectados:** `apps/mobile/android/app/build.gradle`

---

### 3. Debug Keystore Faltante

**Error:** El proceso de firma del APK fallaba porque no existía el archivo `debug.keystore`.

**Causa:** El keystore de debug no se incluye en el repositorio (correcto por seguridad), pero tampoco se había generado localmente.

**Solución:** Generar el keystore de debug manualmente:
```bash
cd apps/mobile/android/app
keytool -genkey -v -keystore debug.keystore \
  -storepass android -alias androiddebugkey \
  -keypass android -keyalg RSA -keysize 2048 \
  -validity 10000 \
  -dname "CN=Android Debug,O=Android,C=US"
```

**Archivos afectados:** `apps/mobile/android/app/debug.keystore` (generado localmente, en `.gitignore`)

---

### 4. Emulador No Puede Alcanzar Metro Bundler (`adb reverse`)

**Error en logcat:**
```
W ReconnectingWebSocket: Couldn't connect to "ws://localhost:8081/message"
```

**Causa:** El emulador Android corre en una red virtual separada. `localhost` dentro del emulador apunta al propio dispositivo, no a la PC del desarrollador. Sin el puente ADB, el emulador no puede encontrar el servidor Metro corriendo en el puerto 8081 del PC.

**Solución:** Ejecutar el bridge ADB **cada vez que se conecte el emulador**:
```bash
adb reverse tcp:8081 tcp:8081
```

**Cuándo ejecutar:** Siempre que inicies el emulador, antes de lanzar la app. Se puede automatizar en `run-android.ps1`.

---

### 5. Variables de Entorno — Prefijos Incorrectos

#### 5a. Expo / React Native (`EXPO_PUBLIC_`)

**Error:**
```
[Supabase] Missing env vars. Check .env.local
Error: supabaseUrl is required.
```

**Causa:** Expo/Metro solo expone variables de entorno al bundle de JavaScript cuando tienen el prefijo **`EXPO_PUBLIC_`**. Las variables sin prefijo solo están disponibles en el proceso de Node (build time), no en el runtime de la app.

**Solución:** Renombrar variables en `apps/mobile/.env.local`:

| Antes (incorrecto) | Después (correcto) |
|---|---|
| `SUPABASE_URL` | `EXPO_PUBLIC_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| `POWERSYNC_URL` | `EXPO_PUBLIC_POWERSYNC_URL` |

**Archivos afectados:** `apps/mobile/.env.local`, `apps/mobile/.env.example`

#### 5b. Vite / Web (`VITE_`)

**Error:**
```
Uncaught Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in apps/web/.env.local
```

**Causa:** Vite solo expone variables al cliente browser cuando tienen el prefijo **`VITE_`**. Sin este prefijo, `import.meta.env.VITE_SUPABASE_URL` es `undefined`.

**Solución:** Agregar las variables con prefijo correcto en `apps/web/.env.local`:

| Antes (incorrecto) | Después (correcto) |
|---|---|
| `SUPABASE_URL` | `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` |

**Archivos afectados:** `apps/web/.env.local`

> **Nota:** Las variables del lado servidor (Edge Functions, SSR) deben mantenerse SIN prefijo.

---

### 6. Singleton de Supabase — Inicialización Eagerly en Módulo Compartido

**Error (en móvil):**
```
Error: supabaseUrl is required.
  at validateSupabaseUrl (supabase-js)
  at createSupabaseClient (packages/db/src/supabase/client.ts)
  at <global> (apps/mobile/src/lib/supabase/client.ts)
```

**Causa raíz:** El paquete compartido `@saas-pos/db` exportaba un singleton de Supabase que se inicializaba a **nivel de módulo** (top-level code). En Expo, Metro inyecta las variables `EXPO_PUBLIC_*` **después** de evaluar los módulos. Por tanto, cuando `packages/db/src/supabase/client.ts` se evaluaba, `process.env.EXPO_PUBLIC_SUPABASE_URL` todavía era `undefined`, causando que `createClient` lanzara un error fatal que cascadeaba y hacía fallar **todas las rutas** de Expo Router.

**Síntoma secundario:** Expo Router reportaba "missing default export" en todos los archivos (login.tsx, _layout.tsx, etc.) porque los módulos fallaban al cargarse, no porque los exports faltaran realmente.

**Solución:** Refactorizar `packages/db/src/supabase/client.ts` a un patrón **Lazy Singleton** usando `Proxy`:

```typescript
// ❌ ANTES — inicialización eagerly (crashea en Expo)
export const supabase = createClient(url, key);

// ✅ DESPUÉS — lazy singleton via Proxy
let _supabaseInstance: SupabaseClient | null = null;

const getOrCreateSupabase = (): SupabaseClient => {
  if (_supabaseInstance) return _supabaseInstance;
  const url = getSupabaseEnv('SUPABASE_URL');
  const key  = getSupabaseEnv('SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('[Supabase] Missing env vars');
  _supabaseInstance = createSupabaseClient(url, key);
  return _supabaseInstance;
};

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    return (getOrCreateSupabase() as any)[prop];
  },
});
```

**Orden de resolución de env vars corregido:**
```
EXPO_PUBLIC_<KEY>  →  VITE_<KEY>  →  <KEY>  (sin prefijo)
```

**Archivos afectados:** `packages/db/src/supabase/client.ts`

---

### 7. Race Condition — PowerSync Context No Disponible en HomeScreen

**Error:**
```
TypeError: Cannot read property 'currentStatus' of null
  at usePowerSyncStatus (@powersync/react)
  at useSyncStatus (apps/mobile/src/hooks/useSyncStatus.ts)
  at HomeScreen (apps/mobile/app/index.tsx)
```

**Causa:** Existe una ventana de tiempo entre que la app renderiza y que `AuthGuard` puede redirigir al login. Durante ese instante, `HomeScreen` (tab `/(tabs)/index.tsx`) ya se renderiza, pero el `PowerSyncContext` aún no existe porque `DatabaseProvider` solo se monta cuando hay una sesión activa. `usePowerSyncStatus` dentro de `useSyncStatus` lanzaba un error al encontrar el contexto `null`.

**Solución en dos capas:**

**Capa 1 — Guard en HomeScreen:** Separar el componente en dos partes: `HomeScreen` (guard) y `AuthenticatedHome` (lógica real). El guard muestra un spinner mientras `isLoading || !session || !tenantId`:

```tsx
export default function HomeScreen() {
  const { tenantId, isLoading, session } = useAuth();
  
  if (isLoading || !session || !tenantId) {
    return <LoadingScreen />;  // spinner — no usa PowerSync
  }
  
  return <AuthenticatedHome tenantId={tenantId} />;
}
```

**Capa 2 — useSyncStatus defensivo:** Envolver `usePowerSyncStatus` en `try/catch` para que no propague el error si el contexto no existe aún:

```typescript
export const useSyncStatus = (): SyncState => {
  let status;
  try {
    status = usePowerSyncStatus();
  } catch {
    return DISCONNECTED; // estado seguro por defecto
  }
  // ...
};
```

**Archivos afectados:**
- `apps/mobile/app/index.tsx`
- `apps/mobile/src/hooks/useSyncStatus.ts`

---

## Resumen de Archivos Modificados

| Archivo | Tipo de cambio | Motivo |
|---|---|---|
| `apps/mobile/android/app/build.gradle` | Modificado | Fijar `ndkVersion` para compilación C++ |
| `apps/mobile/android/app/debug.keystore` | Creado (local) | Firma del APK en modo debug |
| `apps/mobile/.env.local` | Modificado | Prefijos `EXPO_PUBLIC_` requeridos por Expo |
| `apps/mobile/.env.example` | Actualizado | Documentar los nombres correctos de variables |
| `apps/web/.env.local` | Modificado | Prefijos `VITE_` requeridos por Vite |
| `packages/db/src/supabase/client.ts` | Refactorizado | Lazy singleton para evitar crash en Expo |
| `apps/mobile/app/index.tsx` | Modificado | Guard de sesión + separación HomeScreen/AuthenticatedHome |
| `apps/mobile/src/hooks/useSyncStatus.ts` | Modificado | Defensivo ante PowerSyncContext nulo |

---

## Procedimiento de Inicio del Entorno (Checklist)

Para cualquier desarrollador que clone el repositorio en Windows:

```bash
# 1. Instalar dependencias del monorepo
npm install

# 2. Copiar y configurar los .env.local de cada app
#    apps/mobile/.env.local  → variables con EXPO_PUBLIC_
#    apps/web/.env.local     → variables con VITE_
#    .env.local (raíz)       → variables sin prefijo (server-side)

# 3. Generar el debug keystore (una sola vez por máquina)
cd apps/mobile/android/app
keytool -genkey -v -keystore debug.keystore -storepass android \
  -alias androiddebugkey -keypass android -keyalg RSA \
  -keysize 2048 -validity 10000 \
  -dname "CN=Android Debug,O=Android,C=US"

# 4. Iniciar la app web (Vite)
cd apps/web && npm run dev

# 5. Compilar e instalar la app Android (primera vez: ~5-8 min)
cd apps/mobile && npx expo run:android

# 6. Una vez que el emulador esté corriendo, activar el bridge ADB
adb reverse tcp:8081 tcp:8081

# 7. Iniciar Metro para desarrollo activo (builds subsecuentes)
cd apps/mobile && npx expo start -c
```

---

## Lecciones Aprendidas

1. **Los prefijos de env vars son obligatorios por diseño de seguridad** — ni Expo ni Vite exponen variables arbitrarias al cliente. Es intencional.
2. **Los paquetes compartidos en monorepos deben ser lazy-initialized** — un paquete que se evalúa en múltiples contextos (web, mobile, server) no debe asumir que las env vars están disponibles al importarse.
3. **`adb reverse` debe ejecutarse cada sesión** — es el puente de red entre el emulador y el PC. Sin él, la app no puede alcanzar Metro.
4. **Los hooks de contexto de PowerSync no son seguros sin provider** — siempre proteger los componentes que usan `usePowerSyncQuery` / `usePowerSyncStatus` con guards de sesión o try/catch.
5. **EAS Build Cloud no funciona en Windows para builds locales** — usar `npx expo run:android` como alternativa nativa.

---

## Referencias

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode)
- [PowerSync React Hooks](https://docs.powersync.com/client-sdk-references/react-native-and-expo)
- [ADB Reverse Documentation](https://developer.android.com/tools/adb#forwardports)
- [Android NDK Downloads](https://developer.android.com/ndk/downloads)
