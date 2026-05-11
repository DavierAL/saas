# ADR-0031: Plan de Optimización para Barbería

## Estado
- **Fecha**: 2026-05-10
- **Autor**: Davier
- **Estado**: Propuesto

## Contexto
El sistema actual es un SaaS POS genérico. El usuario quiere optimizarlo para barberías. Tras analizar funcionalidades de sistemas especializados (Shemify, Barber-OS, Zenoti, GlossGenius), identificamos las características esenciales que faltan.

## Análisis - Estado Actual vs Necesario

| Módulo | Actual | Necesario para Barbería |
|--------|--------|-------------------------|
| **Citas** | Básico (fecha, cliente, servicio) | Vista diaria por barbero, cola walk-ins, asignar barbero |
| **Clientes** | No existe módulo | Perfiles de clientes, historial, preferencias |
| **Pagos** | Métodos de pago | Propinas, cerrar día por barber, reportes |
| **Servicios** | Catálogo tipo "service" | Paquetes ( haircut + beard), duración, precio |
| **Staff** | Usuarios genéricos | Barberos, comisión, rendimiento |
| **Reportes** | Analytics básico | Por barbero, servicios más populares, propinas |

## Propuestas de Mejora

### FASE 1: Fundamentos (KISS - Prioridad Alta)

#### 1.1 Mejorar Vista de Citas
- **Problema**: Vista actual no muestra barber disponible
- **Solución**: Agregar columna "Barbero" en AppointmentsPage
- **Cambios mínimos**: Solo añadir campo en UI, no schema

#### 1.2 Agregar Módulo Clientes (Básico)
- **Problema**: No hay forma de registrar clientes recurrentes
- **Solución**: Nueva página "Clientes" con CRUD básico
- **Schema**: `customers(id, name, phone, email, notes, tenant_id)`

#### 1.3 Agregar Propinas en Órdenes
- **Problema**: No se registra propinas
- **Solución**: Agregar campo `tip_amount` en orders
- **UI**: En checkout, permitir agregar monto o % de propina

### FASE 2: Funcionalidad Barbería (DRY)

#### 2.1 Servicios con Duración y Descripción
- **Problema**: Solo tenemos `type: service`
- **Solución**: Extender items con campos:
  - `duration_minutes` (para calcular disponibilidad)
  - `description` (para mostrar en booking)

#### 2.2 Asignar Barbero a Cita
- **Problema**: No se sabe quién atiende
- **Solución**: Agregar `barber_id` en appointments
- **UI**: Dropdown para seleccionar barbero

#### 2.3 Reporte por Barbero
- **Problema**: No hay forma de ver rendimiento
- **Solución**: Agregar filtro en analytics por barber
- **Métricas**: Ventas, servicios realizados, propinas

### FASE 3: Experiencia (Si hay tiempo)

#### 3.1 Cola de Walk-ins
- Ver lista de clientes sin cita waiting
- Asignar a barbero disponible

#### 3.2 Paquetes de Servicios
- Crear "Combo" que agrupa servicios (ej: Haircut + Beard)
- Un solo precio, múltiples items en orden

#### 3.3 Cierre de Caja por Barbero
- Ver propinas + ventas por cada barbero al final del día

## Plan de Implementación

### Semana 1: Fundamentos
1. [ ] Agregar `tip_amount` a orders (schema + UI)
2. [ ] Crear página Clientes con lista básica
3. [ ] Agregar columna "Barbero" en citas

### Semana 2: Staff & Servicios
4. [ ] Agregar `barber_id` a appointments
5. [ ] Agregar `duration_minutes` a items (services)
6. [ ] Agregar selector barbero en crear cita

### Semana 3: Reportes
7. [ ] Dashboard barber: ventas diarias por barbero
8. [ ] Top servicios más demandados
9. [ ] Reporte de propinas por barbero

## Notas Técnicas

- No crear nuevas tablas si se puede reutilizar estructura existente
- Usar existentes: `users` para barberos, `items` para servicios
- Mantener compatible con otros tipos de tenant (restaurant, retail)
- Agregar `industry_type = 'barbershop'` en tenant para features específicas