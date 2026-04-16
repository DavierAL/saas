# 🏛️ SaaS POS Multi-Tenant Local-First: Guía Arquitectónica y DevOps

Este documento sirve como el "Single Source of Truth" (Única Fuente de la Verdad) para la arquitectura, el diseño de sistemas y los procesos de ciclo de vida (DevOps) del proyecto. Su objetivo es proporcionar un contexto completo a cualquier IA, ingeniero o herramienta que participe en el desarrollo de la plataforma.

---

## 1. Visión General del Producto

La aplicación es un **Punto de Venta (POS) Modular, Multi-Inquilino (Multi-Tenant) y Local-First** diseñado inicialmente para el mercado peruano (pagos vía Yape/Plin/Transferencia). Está dirigida a pequeños comercios (abarrotes, restaurantes, barberías) y garantiza disponibilidad absoluta al no requerir internet constante para operar la caja registradora.

---

## 2. Paradigmas y Patrones Arquitectónicos

- **Local-First / Offline-First:** El cliente (app móvil) siempre interactúa (lectura/escritura) directamente con la base de datos local (SQLite). La nube (PostgreSQL) es una réplica asíncrona. Esto garantiza latencia cero (0ms) en la UI y tolerancia total a fallos de red.
- **Monorepo Estricto (Turborepo/Nx):** La plataforma se compone de dos aplicaciones principales:
  - `apps/mobile`: La aplicación del cajero (React Native / Expo).
  - `apps/web`: El dashboard administrativo del dueño (React / Next.js / Vite).
  - `packages/*`: Lógica de dominio compartida, tipos, configuraciones de base de datos y reglas de negocio.
- **Modularidad por "Feature Flags" (Configuración JSON):** Un único código base (APK/Web). La UI se adapta (muestra/oculta botones y módulos) basándose en la configuración (`modules_config`) asociada al `tenant_id` que inicia sesión.
- **Single Table Inheritance (Catálogo):** Productos y servicios se unifican en una única tabla `items` con un discriminador `type` (ej. `product`, `service`), simplificando la lógica transaccional del carrito de compras.
- **Transactional Outbox Pattern:** Para efectos secundarios que requieren internet (ej. enviar factura a SUNAT). Las acciones se guardan como eventos en una tabla local. Al recuperar conexión, se sincronizan a AWS y un trigger (Lambda) ejecuta la llamada HTTP.

---

## 3. Stack Tecnológico

### 🖥️ Frontend (Capa de Presentación)

- **App Móvil:** React Native manejado con **Expo**.
- **App Web:** React (Framework a definir: Vite o Next.js).
- **Estado de UI (Efímero):** **Zustand**. Estrictamente para estados transitorios (modales abiertos, inputs de búsqueda, carrito de compras activo). **Prohibido** usar Zustand para almacenar datos traídos de la base de datos.
- **Rendimiento de UI (Listas):** **FlashList (Shopify)**. Mandatorio para catálogos largos. Reemplaza a `FlatList` para garantizar 60fps constantes reciclando vistas en memoria.
- **Patrón de Datos a UI:** _Hooks Reactivos_. Los componentes se suscriben directamente a queries SQL locales (ej. `usePowerSyncQuery`), re-renderizándose automáticamente solo cuando SQLite cambia.

### 💾 Base de Datos y Sincronización

- **Base de Datos Local (Dispositivo):** **SQLite** (a través de expo-sqlite o similar). Es la única fuente de verdad para el Frontend.
- **Motor de Sincronización:** **PowerSync (Self-Hosted en AWS)**. Sincroniza bidireccionalmente SQLite (cliente) con PostgreSQL (servidor) usando WebSockets, manejando conflictos automáticamente.
- **Base de Datos Nube (Global):** **PostgreSQL** (alojado en AWS RDS).
- **Transacciones Locales:** Crucial para el Checkout (Paso 5 del flujo). Insertar `Order` y `OrderLines` debe realizarse bajo una estricta transacción SQLite local para asegurar atomicidad.

### ☁️ Backend y Cloud (AWS)

- **Infraestructura de Sincronización:** **AWS ECS (Fargate)** o instancia EC2 ejecutando el contenedor Docker de PowerSync.
- **Autenticación y Seguridad:** **Supabase Auth**.
  - **Row-Level Security (RLS):** Supabase inyecta el `tenant_id` en el JWT. PostgreSQL usa este JWT para asegurar matemáticamente (a nivel de base de datos) que un Tenant no pueda leer/escribir datos de otro.

### 💳 Suscripciones y Pagos (B2B SaaS)

- **Modelo de Facturación:** Manual / Semi-automatizado (Yape, Plin, Transferencias).
- **El "Paywall" Offline:** La tabla del Tenant contiene el campo `valid_until`. La app valida la fecha actual del dispositivo contra `valid_until`. Si expira, se bloquea la tabla `orders` (no se puede cobrar), pero no se borran los datos del cliente.

---

## 4. Los 4 Pilares Operativos (Ciclo de Vida y DevOps)

### Pilar 1: Migraciones de Esquema (Data Lifecycle)

Dado el paradigma Local-First, la base de datos reside en los dispositivos.

- **Backend (Postgres):** Migraciones aditivas (nunca eliminar columnas/tablas).
- **Frontend (SQLite):** Control estricto de `schemaVersion`. Si se distribuye un APK con `schemaVersion: 2`, la app debe ejecutar un script local (ej. `ALTER TABLE...`) antes de montar la UI si detecta que la base instalada es versión 1.

### Pilar 2: Distribución y Actualizaciones (CI/CD & OTA)

- **Distribución Inicial:** La app móvil se distribuye principalmente como archivo **APK** instalable directamente en los terminales POS (tablets/teléfonos de los negocios). Se compila usando **EAS Build** (Expo Application Services) en la nube.
- **Parches Inmediatos (Magia OTA):** Para corregir errores de lógica (JS/TS) o UI sin tener que visitar cada tienda para instalar un nuevo APK, se utilizará **EAS Update (Over-The-Air)**. El código nuevo se descarga en segundo plano y se aplica al reiniciar la app. (Solo los cambios de código nativo requieren un nuevo APK).

### Pilar 3: Observabilidad Offline (Monitoreo)

- **Sentry:** Herramienta principal para captura de errores. Su capacidad de guardar _stack traces_ en disco cuando no hay internet y enviarlos al recuperar la conexión es crítica para depurar terminales POS que fallan offline.
- **Logs Estructurados:** Implementar un sistema de logs en archivo local para rastrear problemas de sincronización.

### Pilar 4: Calidad (Testing Pyramid)

- **Unit Tests (Jest):** Obligatorios para la lógica matemática crítica (cálculo de impuestos, vueltos, totales del carrito).
- **Component Tests:** Validar renderizado condicional basado en Roles (RBAC).
- **E2E Tests (Maestro):** Automatizar el flujo crítico simulando a un usuario real: "Log in -> Buscar Producto -> Cobrar -> Apagar WiFi -> Verificar Guardado".

---

## 5. Estrategia de Entornos (Environments)

Para proteger la integridad de los datos de los clientes reales, el proyecto requiere dos entornos aislados:

- **PRODUCCIÓN (Prod):** Donde transaccionan los clientes.
  - Base de Datos: Postgres Producción.
  - App ID: `com.misaas.app` (Icono Rojo).
- **STAGING (Pruebas):** Clon exacto para validar nuevas características y actualizaciones OTA.
  - Base de Datos: Postgres Staging (datos dummy).
  - App ID: `com.misaas.app.staging` (Icono Gris).
  - **Beneficio:** Permite tener ambas aplicaciones (Prod y Staging) instaladas simultáneamente en el mismo dispositivo de desarrollo mediante el uso de "Expo Profiles" en el archivo `eas.json`.

---

## 6. Siguientes Pasos (Roadmap de Ejecución)

- **Fase 0:** Configuración del Monorepo (Turborepo) y plantillas base (Expo / Vite).
- **Fase 1:** El "Hello World" de Sincronización (Conectar Supabase + PowerSync + App Móvil y probar persistencia offline/online).
- **Fase 2:** Modelado de Base de Datos Real (Catálogo, Ordenes, Tenants) y Políticas RLS.
- **Fase 3:** Construcción de UI (FlashList para inventario, Zustand para carrito).
