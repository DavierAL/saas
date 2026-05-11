# ADR-0032: Migración de Esquema para Soporte Completo de Barberías

## Estado
- **Fecha**: 2026-05-10
- **Autor**: Davier
- **Estado**: Aceptado e Implementado

## Contexto

Derivado del plan propuesto en el **[ADR-0031](./ADR-0031-barbershop-optimization-plan.md)**, se identificó que el esquema actual de base de datos (diseñado inicialmente para un POS más genérico enfocado en retail/restaurantes) carecía de campos esenciales para el correcto funcionamiento de una barbería profesional (gestión de personal especializado, clientes recurrentes, propinas y tiempos de servicio).

Para no ensuciar la base de código con "hacks" (como inyectar todo en el campo JSON `raw_user_meta_data`), se decidió que era mandatorio realizar modificaciones estructurales directas a las tablas core en Supabase, así como al esquema local de PowerSync para soportar la aplicación móvil de manera offline.

## Decisiones Técnicas y Justificación

### 1. Extensión del Constraint de Roles (Rol: `staff`)
Se eliminaron y recrearon los `CHECK constraints` de roles en las tablas `public.users` y `public.tenant_members` para permitir el nuevo rol `'staff'`.
- **Justificación**: Se necesitaba una forma de otorgar acceso a la plataforma a los profesionales (barberos, estilistas) sin darles privilegios totales de caja (`cashier`) o configuración (`admin`), restringiéndolos exclusivamente a sus agendas.

### 2. Creación de la Entidad Clientes (`public.customers`)
Se creó una nueva tabla dedicada para clientes con soporte RLS.
- **Justificación**: Anteriormente el nombre del cliente se guardaba como simple texto libre en las órdenes y citas (`customer_name: string`). Un modelo de barbería requiere **retención de clientes**, revisar el historial de visitas, frecuencias y **notas de preferencias** (ej. "Prefiere el número 2 a los lados").

### 3. Trazabilidad en Citas (`public.appointments`)
Se agregaron las llaves foráneas `barber_id` (vinculado a `users`) y `customer_id` (vinculado a `customers`).
- **Justificación**: Vital para mostrar vistas de calendario filtradas por empleado, y fundamental para que el cliente se atienda con su barbero favorito.

### 4. Trazabilidad en Ventas y Propinas (`public.orders`)
Se agregó la columna `tip_amount` (INTEGER) y la relación `customer_id`.
- **Justificación**: La propina es un ingreso que no pertenece al negocio sino al empleado. Mezclarla con el `total_amount` destruiría la contabilidad del negocio al momento de calcular impuestos o cierre de caja. El separar este campo permite hacer cierres diarios exactos.

### 5. Parámetros de Agendamiento en Servicios (`public.items`)
Se agregó el campo `duration_minutes` (INTEGER).
- **Justificación**: Sin este campo, el sistema no tiene forma de saber cuántos bloques de 15, 30 o 45 minutos bloquear en el calendario cuando un cliente agenda un "Corte de Cabello" vs un "Corte + Barba".

### 6. Comisiones Nativas (`public.tenant_members`)
Se agregó el campo `commission_rate` (NUMERIC).
- **Justificación**: Aunque inicialmente se probó guardar comisiones en metadata JSON, moverlo a una columna explícita de Postgres permite ejecutar reportes analíticos complejos muy rápidos directamente con SQL (ej: `SUM(total_amount) * commission_rate`).

### 7. Sincronización Inmediata con PowerSync
El esquema en `packages/sync/src/powersync-schema.ts` fue actualizado obligatoriamente con todos estos nuevos campos.
- **Justificación**: Como la aplicación utiliza PowerSync para soporte *Offline-first*, la base de datos local SQLite debe replicar exactamente la estructura de Postgres. Omitir este paso hubiera causado errores silenciosos o crashes en la app móvil.

## Consecuencias

### Positivas
- **Escalabilidad**: El modelo de datos ahora es robusto y puede escalar no solo para barberías, sino para Spas, Salones de Belleza o Clínicas, donde operan dinámicas de citas y profesionales por comisión.
- **Cierres Precisos**: La separación de propinas y comisiones facilitará enormemente la creación de reportes financieros al final del mes.

### Negativas
- **Deuda Técnica Menor**: En algunas tablas aún conservamos el campo de texto `customer_name` como medida de "seguridad / compatibilidad retroactiva" (para "Walk-ins" rápidos que no quieren dejar sus datos). Esto exige que el frontend maneje la lógica de priorizar `customer_id` pero tener un fallback a `customer_name`.
