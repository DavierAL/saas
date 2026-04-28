# 📱 Guía de Instalación y Pruebas en Dispositivos Móviles

Esta guía detalla los pasos necesarios para instalar y probar la aplicación móvil de **SaaS POS** en tu celular físico. Debido a que la app utiliza **PowerSync** y **SQLite**, requiere una configuración de "Código Nativo" que no es compatible con el Expo Go estándar.

---

## 1. Requisitos Previos

1.  **Node.js**: Asegúrate de tener instalada la versión LTS.
2.  **EAS CLI**: Instala la herramienta de Expo globalmente:
    ```bash
    npm install -g eas-cli
    ```
3.  **Cuenta de Expo**: Regístrate en [expo.dev](https://expo.dev) e inicia sesión en tu terminal:
    ```bash
    eas login
    ```

---

## 2. Generar el Cliente de Desarrollo (Development Build)

Tienes dos opciones para generar el archivo instalable (APK para Android o simulador para iOS).

### Opción A: Construcción en la Nube (Más sencilla)
Ideal si no tienes Android Studio o Xcode configurado localmente.
1. Ve a la carpeta de la app: `cd apps/mobile`
2. Ejecuta:
   ```bash
   npx eas build --profile development --platform android
   ```
3. Al finalizar, EAS te proporcionará un link o un código QR para descargar el APK directamente en tu celular.

### Opción B: Construcción Local (Más rápida si tienes el entorno)
Requiere tener configurado Android Studio / SDK.
```bash
npx eas build --profile development --platform android --local
```

---

## 3. Configuración de Red y Sincronización

Para que la app pueda comunicarse con el motor de PowerSync desde tu celular:

1.  **Misma Red**: Tu celular y tu PC **deben** estar conectados a la misma red Wi-Fi.
2.  **Identificar tu IP**: En Windows ejecuta `ipconfig` (busca "Dirección IPv4").
3.  **Actualizar .env.local**: Asegúrate de que el archivo `apps/mobile/.env.local` apunte a la IP de tu PC:
    ```env
    POWERSYNC_URL=http://<TU_IP_LOCAL>:8081
    ```

---

## 4. Ejecutar el Servidor de Desarrollo

Una vez instalada la app en tu celular:

1.  Inicia el servidor desde `apps/mobile`:
    ```bash
    npm run dev
    ```
2.  Abre la app en tu celular.
3.  La app debería detectar automáticamente el servidor en tu red local. Si no, escanea el código QR que aparece en la terminal.

---

## 5. Solución de Problemas Comunes

*   **Error de Conexión**: Verifica que el firewall de Windows no esté bloqueando los puertos `8081` (Metro) y el puerto donde corre PowerSync.
*   **PowerSync no sincroniza**: Asegúrate de que el contenedor de PowerSync esté corriendo y escuchando en la IP correcta.
*   **Cambio de Lógica Nativa**: Si agregas una nueva librería nativa (ej. una para Bluetooth o Impresoras), deberás generar un **nuevo build** (Paso 2). Si solo cambias código JS/TS, los cambios se reflejarán instantáneamente sin reinstalar.
