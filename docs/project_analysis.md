# Análisis Integral del Proyecto: SaaS POS

Este documento proporciona una visión detallada de la arquitectura, el stack tecnológico y el estado actual de la implementación del sistema SaaS POS (Punto de Venta).

## 1. Arquitectura del Sistema
El proyecto sigue una **Arquitectura Hexagonal (Clean Architecture)** dentro de un monorepo gestionado por `Turbo`.

### Capas del Monorepo (`/packages`)
- **`@saas-pos/domain`**: El núcleo. Contiene las reglas de negocio puras, entidades (`Order`, `Item`, `Tenant`) y objetos de valor. Es agnóstico a cualquier framework.
- **`@saas-pos/application`**: Orquestación de casos de uso (`checkout`, `validate-subscription`). Define los "Ports" (interfaces) que deben implementar los adaptadores externos.
- **`@saas-pos/db`**: Adaptadores de persistencia. Implementa los repositorios para SQLite (Móvil) y Supabase/Postgres (Web/Server).
- **`@saas-pos/sync`**: Capa de sincronización que define el esquema de PowerSync compartido entre el cliente móvil y el backend.
- **`@saas-pos/ui`**: Sistema de diseño unificado. Tokens de color, tipografía y componentes base (Botones, Inputs).
- **`@saas-pos/utils`**: Funciones auxiliares compartidas (formateo de moneda, manejo de fechas ISO).

## 2. Aplicación Móvil (`/apps/mobile`)
Desarrollada con **Expo** y optimizada para ser **Offline-First**.

- **Enrutamiento**: `expo-router` con navegación basada en archivos.
- **Persistencia Local**: SQLite gestionado por **PowerSync**, lo que garantiza que el cajero pueda seguir operando sin internet.
- **Estado Epímero**: `Zustand` maneja el estado del carrito de compras por ser ligero y reactivo.
- **UX/UI**: Recientemente estabilizada con `LoadingScreen` durante el arranque y `Skeleton Screens` para las listas de productos y órdenes.

## 3. Dashboard Web (`/apps/web`)
Panel administrativo para la gestión de inventarios y análisis de ventas.

- **Stack**: React + Vite.
- **Autenticación**: Supabase Auth integrado con proveedores externos.
- **Analíticas**: Consume funciones RPC de Postgres para agregaciones de ventas en tiempo real.

## 4. Infraestructura y Backend
- **Supabase**: Fuente de verdad central. Proporciona PostgreSQL, RLS (Row Level Security) para multi-tenancy, y Edge Functions.
- **PowerSync**: Puente de sincronización que transforma las mutaciones de Postgres en flujos de datos para SQLite local.
- **Monorepo**: Configurado con `pnpm workspaces` y `turbo` para compilación paralela y cacheo de builds.

## 5. Auditoría de Estado Actual (Sprint 2)

### Fortalezas
- **Desacoplamiento**: El cambio de SQLite a Postgres es transparente gracias a la capa de aplicación.
- **Multi-tenancy**: Implementado a nivel de base de datos (RLS) y propagado hasta el JWT claims.
- **Estabilidad Móvil**: Se resolvieron los problemas de inicialización (pantallas blancas) y se mejoró la percepción de velocidad.

### Áreas de Mejora / Gaps
1. **Cobertura de Tests**: Actualmente en ~50% en paquetes críticos. Objetivo: 80% (Vitest).
2. **Resiliencia Offline**: Falta un indicador global visual que informe al usuario si está sincronizado o en modo offline (Planeado para Fase 3).
3. **Integración de Hardware**: Pendiente la integración nativa con impresoras térmicas y escáneres de códigos de barras (Fase 3/4).
4. **Manejo de Errores**: Estandarizar el "Error Boundary" en la aplicación móvil para capturar fallos de PowerSync.

## Conclusión
El proyecto está en una fase de **madurez de arquitectura**. La base es sólida y escalable. El enfoque actual debe centrarse en completar la integración de hardware y fortalecer la resiliencia en condiciones de red extremas.
