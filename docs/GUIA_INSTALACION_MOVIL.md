# 📱 Guía de Instalación: SaaS POS en tu Celular

Esta guía te explica paso a paso cómo instalar la aplicación SaaS POS en tu celular Android para poder probar la app en un entorno real.

---

## 1. Requisitos Previos

### Hardware
- Un celular Android (Android 8.0 o superior)
- Cable USB para conectar el celular a tu computadora
- Tu computadora debe tener **Android Studio** instalado (para los drivers USB)

### Software en la Computadora
- Node.js 18+ (`node -v` para verificar)
- npm (`npm -v` para verificar)
- Android Studio con:
  - Android SDK
  - Platform Tools
  - USB Driver

---

## 2. Configuración del Celular

### 2.1 Habilitar Opciones de Desarrollador
1. Ve a **Configuración > Información del teléfono**
2. Toca 7 veces sobre **Número de compilación** hasta que aparezca "Modo desarrollador habilitado"
3. Ve a **Configuración > Opciones del desarrollador**
4. Activa:
   - **Depuración USB** ✅
   - **Instalar por USB** ✅ (opcional, pero recomendado)

### 2.2 Conectar el Celular
1. Conecta el celular a tu computadora mediante el cable USB
2. En el celular, cuando aparezca una notificación de "Depuración USB", toca **Permitir**
3. Verifica la conexión ejecutando en tu computadora:
   ```bash
   adb devices
   ```
   Deberías ver tu dispositivo en la lista.

---

## 3. Configuración del Proyecto

### 3.1 Variables de Entorno
1. Copia el archivo de ejemplo:
   ```bash
   cp apps/mobile/.env.example apps/mobile/.env.local
   ```

2. Edita `apps/mobile/.env.local` y completa los valores:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   EXPO_PUBLIC_POWERSYNC_URL=https://tu-instancia.powersync.journeyapps.com
   ```

   > **¿Dónde encuentro estos valores?**
   > - **Supabase**: Ve a [Supabase Dashboard](https://supabase.com) → Tu proyecto → Settings → API
   > - **PowerSync**: Lo obtienes de tu proveedor de PowerSync self-hosted

### 3.2 Instalar Dependencias
```bash
npm install --legacy-peer-deps
```

### 3.3 Generar Código Nativo (Android)
```bash
cd apps/mobile
npx expo prebuild
```
Este comando genera la carpeta `android/` necesaria para compilar la app.

---

## 4. Instalar la App en tu Celular

### Opción A: Desarrollo Rápido (Recomendado)
Ejecuta este comando desde la raíz del proyecto:
```bash
npm run android
```

Qué hace:
1. Compila el código JavaScript
2. Genera un APK temporal
3. Instala la app en tu celular conectado
4. Abre automáticamente el servidor de desarrollo (Metro)

> **Nota**: Cada vez que guardsas un archivo TS/JS, Metro actualiza la app automáticamente (Hot Reload).

### Opción B: APK de Producción (Instalación Independiente)
Si quieres un APK que funcione sin需要 conexión a tu computadora:

1. Limpia compilaciones anteriores:
   ```bash
   cd apps/mobile/android
   ./gradlew clean
   ```

2. Genera el APK de release:
   ```bash
   ./gradlew assembleRelease
   ```

3. El APK estará en:
   ```
   apps/mobile/android/app/build/outputs/apk/release/app-release.apk
   ```

4. Pasa el APK a tu celular (por email, Google Drive, etc.) e instálalo.

---

## 5. Verificación

### 5.1 ¿Se instala correctamente?
Al abrir la app deberías ver la pantalla de login.

### 5.2 ¿PowerSync funciona?
La app debería sincronizar datos automáticamente. Verifica en la consola de desarrollo (Metro) que no haya errores de conexión.

### 5.3 ¿Puedo hacer cambios de código?
Sí. Solo modifica archivos en `apps/mobile/` y guarda. Metro actualiza la app automáticamente.

---

## 6. Solución de Problemas

### Problema: "Dispositivo no encontrado"
```bash
adb devices
```
Si no ves tu dispositivo:
1. Verifica que el cable USB esté bien conectado
2. Activa la "Depuración USB" en tu celular
3. Instala los drivers USB de Android Studio

### Problema: "EBUSY" al compilar
Cierra todos los procesos Gradle:
```bash
taskkill /F /IM java.exe   # Windows
pkill -f gradle             # Mac/Linux
```

### Problema: La app crashea al abrir
1. Revisa el archivo `.env.local` — los valores de Supabase y PowerSync deben ser correctos
2. Verifica que tu celular tenga conexión a internet
3. Revisa los logs de Metro en la terminal

### Problema: Metro no conecta
1. Verifica que tu celular y tu computadora estén en la **misma red Wi-Fi**
2. En la terminal de Metro, presiona `m` y selecciona "Toggle Dev Mode"
3. Verifica tu IP local en `apps/mobile/.env.local` (variable `POWERSYNC_URL`)

---

## 7. Información Adicional

| Aspecto | Detalle |
|--------|---------|
| **Paquete Android** | `com.davieral.saaspos` |
| **Versión** | `1.0.0` |
| **Orientación** | Vertical (Portrait) |
| **Android mínimo** | Android 8.0 (API 26) |
| **Sentry** | Habilitado en producción (no en desarrollo) |

### Rutas Clave del Proyecto
- **App principal**: `apps/mobile/app/`
- **Componentes**: `apps/mobile/src/components/`
- **Estado (Zustand)**: `apps/mobile/src/stores/`
- **Base de datos local**: `apps/mobile/src/lib/powersync/`
- **Proveedor de autenticación**: `apps/mobile/src/providers/AppProvider.tsx`

---

## 8. Comandos Rápidos de Referencia

| Comando | Dónde | Qué hace |
|---------|-------|----------|
| `npm run android` | Raíz | Compila, instala y abre la app |
| `npx expo prebuild` | `apps/mobile` | Regenera el proyecto nativo Android |
| `./gradlew assembleRelease` | `apps/mobile/android` | Genera APK de producción |
| `./gradlew clean` | `apps/mobile/android` | Limpia archivos de compilación |
| `npm run dev` | `apps/mobile` | Solo inicia el servidor Metro |

---

¿Necesitás ayuda adicional? Revisá los archivos `docs/MOBILE_DEPLOYMENT_GUIDE.md` y `docs/guia-arquitectonica-y-devOps.md` en el proyecto.
