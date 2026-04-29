# 📱 Manual de Operación: SaaS POS Mobile

Este manual detalla los pasos para trabajar con la aplicación móvil en entornos de **Desarrollo** y **Producción**, explicando el propósito de cada comando.

---

## 🚀 1. Modo Desarrollo (Local & Debug)
Usa este modo mientras escribes código. Permite **Fast Refresh** (ver cambios al instante) y depuración.

### Paso 1: Instalación de dependencias (Si hay cambios)
Si has descargado cambios o modificado el `package.json`.
```powershell
# En la raíz del proyecto
npm install --legacy-peer-deps
```
*   **Por qué**: Descarga las librerías necesarias. Usamos `--legacy-peer-deps` porque el monorepo mezcla versiones de React (18 en web, 19 en móvil) y NPM es estricto con esto.

### Paso 2: Sincronizar código nativo
Cada vez que cambies algo en `app.json` o instales una librería que use hardware (Cámara, SQLite, etc).
```powershell
cd apps/mobile
npx expo prebuild
```
*   **Por qué**: Genera la carpeta `/android` a partir de tu configuración de Expo. Es el "puente" entre JavaScript y el sistema Android.

### Paso 3: Ejecutar en dispositivo/emulador
Tienes dos formas de hacerlo:

**A. Ejecución Directa (Recomendada si tienes Android Studio):**
```powershell
# Desde la raíz del proyecto
npm run android
```
*   **Por qué**: Compila la app en modo debug, la instala en tu celular/emulador y abre el servidor de Metro automáticamente.

**B. Solo Servidor Metro (Si ya tienes la app instalada):**
```powershell
cd apps/mobile
npm run dev
```
*   **Por qué**: Inicia el servidor que "envía" el código JavaScript a la app. Es útil si ya tienes la app instalada y solo quieres aplicar cambios de código.

---

## 📦 2. Modo Producción (APK de Instalación)
Usa este modo cuando quieras generar un archivo `.apk` final para instalar en cualquier celular sin depender de tu PC.

### Paso 1: Limpieza preventiva
```powershell
cd apps/mobile/android
./gradlew clean
```
*   **Por qué**: Borra archivos temporales de compilaciones anteriores para evitar errores extraños y asegurar que el APK sea "puro".

### Paso 2: Generar el APK de Release
```powershell
# Dentro de apps/mobile/android
./gradlew assembleRelease
```
*   **Por qué**: Gradle (el motor de construcción de Android) compila todo el proyecto, optimiza el código JavaScript y genera un archivo instalable en:
    `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 🛠️ Resumen de Comandos Críticos

| Comando | Dónde | Propósito |
| :--- | :--- | :--- |
| `npm run android` | Raíz | **Compilar e instalar** la app en modo desarrollo. |
| `npx expo prebuild` | `apps/mobile` | **Regenerar** la carpeta nativa `/android`. |
| `./gradlew assembleRelease`| `apps/mobile/android` | **Crear el APK** final para producción. |
| `taskkill /F /IM java.exe` | Raíz | **Desbloquear** archivos si Gradle se queda "pegado". |

---

## 💡 Consejos de Oro

1.  **¿Cambiaste el código TS/JS?** No necesitas reinstalar. Solo guarda el archivo y Metro actualizará la app (Hot Reload).
2.  **¿Instalaste una nueva librería?** Debes hacer `npx expo prebuild` y volver a ejecutar `npm run android`.
3.  **PowerSync e IP**: Si pruebas en un celular físico, asegúrate de que tu PC y el celular estén en el mismo Wi-Fi. Si usas PowerSync local, verifica tu IP en `apps/mobile/.env.local`.
4.  **Error "EBUSY"**: Si Windows te dice que no puede borrar una carpeta, usa el comando `taskkill` mencionado arriba para cerrar Gradle.
