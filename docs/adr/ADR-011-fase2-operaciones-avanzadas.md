# ADR-011: Fase 2 — Operaciones Avanzadas

**Fecha:** 2026-05-04
**Status:** Completado
**Autor:** Claude (AI)

## Contexto

Continuación del desarrollo del dashboard web SaaS POS. Fase 1 agregó funcionalidades core admin (export CSV, gestión usuarios, suscripción, detalle orden). Fase 2 enfoca en operaciones avanzadas para potenciar la operación diaria.

## Decisiones Clave

### 2.1 Reembolso/Anulación de Órdenes
- **Decisión:** Implementar en el OrderDetailDrawer existente, no en página separada
- **Razón:** Mantiene el contexto de la orden, reduce navegación
- **Validación:** Usa `isValidOrderTransition()` del domain
- **Alternativa:** Crear página dedicada → rechazada por menor contexto de usuario

### 2.2 Cierre de Caja Diario
- **Decisión:** Nueva página `/cash-closing` con query directa (no RPC)
- **Razón:** Simplicidad, datos ya disponibles en tabla orders
- **Alternativa:** RPC `get_daily_closing` → postergada para después

### 2.3 Alertas de Stock Bajo
- **Decisión:** Página dedicada `/stock-alerts`, no usar sección en inventario
- **Razón:** Mejor UX,阈值 configurable, funcionalidad分离
- **Stock threshold:**默认值10,可配置
- **Indicadores visuales:** rojo (0), naranja (<threshold), verde (>threshold)

### 2.4 Métodos de Pago
- **Decisión:** Tabla `payment_methods` sin usar PowerSync inicialmente
- **Razón:** Simplificar, migración posterior
- **Preferencia:** Solo CRUD básico, sincronización móvil para Fase 3

## Cambios Técnicos

### Paquetes Modificados
- `packages/application/src/use-cases/update-order-status.ts` (NUEVO)
- `packages/application/src/use-cases/update-order-status.ts` (NUEVO)
- `packages/db/src/postgres/repositories/item-repository.ts` - add findLowStock, incrementStock
- `packages/db/src/postgres/repositories/order-repository.ts` - add getDailyClosing
- `packages/db/src/postgres/repositories/payment-method-repository.ts` (NUEVO)
- `packages/domain/src/entities/order.ts` - payment_method opcional

### Páquetes No Modificados (pendientes)
- `packages/sync/src/powersync-schema.ts` - no se agregó payment_methods
- Migración Supabase - no ejecutada

## Stack de Nuevas Rutas
- `/cash-closing` -CashClosingPage
- `/stock-alerts` -StockAlertsPage  
- `/payment-methods` -PaymentMethodsPage

## Pendientes Post-Fase 2
1. Tests para update-order-status
2. Tests para manage-payment-methods
3. Migración SQL para payment_methods + RLS
4. Agregar payment_methods a PowerSync schema
5. Documentar RPCs en SUPABASE_GUIDE.md
6. Columna stock_alert_threshold opcional

## Checklist de Cierre
- [x] typecheck pasa
- [x] build pasa
- [ ] Todas las nuevas tablas tienen RLS y PowerSync
- [ ] Tests para use cases
- [ ] Documentación de RPCs

## Resultado
**Fase 2 completada exitosamente** con build limpio. Las features 2.1-2.4 implementadas. Pendientes principales son migraciones SQL y sincronización con móvil.