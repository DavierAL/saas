# ADR-003: Schema Sync — Alineación de Schemas Locales con Supabase (PostgreSQL)

**Date:** 2026-05-05  
**Status:** Accepted  
**Deciders:** Engineering Team  
**Ticket:** Schema Drift Resolution — Discovered via MCP Supabase audit

---

## Context

Al consultar el estado real de la base de datos en Supabase mediante el MCP (`list_tables` con `verbose: true`), se descubrió que los archivos de schema locales del repositorio estaban desactualizados respecto a la base de datos en producción.

Los archivos afectados eran:
- `packages/db/src/postgres/schema.sql` — Definición de referencia para PostgreSQL
- `packages/db/src/schema/sqlite-schema.ts` — Schema SQLite local para PowerSync (mobile)
- `packages/db/src/migrations/migration-runner.ts` — Migraciones aditivas para dispositivos existentes

El schema del **dominio** (`packages/domain/src/entities/`) ya estaba correcto e incluía todos los campos nuevos. Los repositorios SQLite también usaban esos campos en sus queries. El desfase era exclusivamente documental y en la definición de tablas.

---

## Problem

### Discrepancias detectadas (Local vs. Supabase)

| Tabla | Campo | Local (antes) | Supabase (real) |
|---|---|---|---|
| `tenants` | `currency` | ❌ Faltaba en `schema.sql` | ✅ `TEXT DEFAULT 'PEN'` |
| `tenants` | `last_remote_validation_at` | ❌ Faltaba en `schema.sql` y `sqlite-schema.ts` | ✅ `TIMESTAMPTZ NULL` |
| `orders` | `currency` | ❌ Faltaba en ambos | ✅ `TEXT DEFAULT 'PEN'` |
| `orders` | `customer_name` | ❌ Faltaba en `schema.sql` | ✅ `TEXT NULL` |
| `orders` | `status` CHECK | Solo `pending,paid,cancelled` | ✅ Incluye `refunded, partially_refunded, voided` |
| `order_lines` | `tenant_id` | ❌ Faltaba en `sqlite-schema.ts` | ✅ `UUID NOT NULL` |
| `tenant_members` | (Tabla completa) | ❌ No documentada | ✅ Tabla existente y activa (2 rows) |

---

## Decision

Actualizar los archivos locales para reflejar exactamente el estado de Supabase en producción. **No se modifica Supabase** — los cambios son únicamente locales (source of truth = Supabase).

### Principios aplicados

1. **Supabase es la fuente de verdad** para el schema PostgreSQL.  
2. **Migraciones aditivas únicamente** — no se eliminan columnas ni se rompe compatibilidad.  
3. **`password_hash` excluido intencionalmente de SQLite** — por seguridad, el hash de contraseña nunca se replica al dispositivo móvil.
4. **Los repositorios y el dominio no requirieron cambios** — ya estaban implementando los campos correctamente.

---

## Changes Made

### 1. `packages/db/src/postgres/schema.sql`

**Razón:** Archivo de referencia desactualizado. Los ingenieros que lean este archivo necesitan ver el schema real.

Cambios:
- ➕ `currency TEXT NOT NULL DEFAULT 'PEN'` en tabla `tenants`
- ➕ `last_remote_validation_at TIMESTAMPTZ` en tabla `tenants`
- ➕ Tabla `tenant_members` (vincula `auth.users` ↔ `public.tenants`, requerida por el JWT auth hook)
- ➕ `currency TEXT NOT NULL DEFAULT 'PEN'` en tabla `orders`
- ➕ `customer_name TEXT` en tabla `orders`
- 🔧 `orders.status` CHECK expandido: se agregaron `refunded`, `partially_refunded`, `voided` para alinearse con la máquina de estados definida en `domain/entities/order.ts`
- 📝 Comentarios de referencia `[ADR-003]` en columnas nuevas
- 📝 Header actualizado con fecha de sync

### 2. `packages/db/src/schema/sqlite-schema.ts`

**Razón:** Schema SQLite era la causa raíz de posibles fallos de sincronización con PowerSync: si la tabla local no tiene `tenant_id` en `order_lines`, PowerSync no puede aplicar sus reglas de sync correctamente.

Cambios:
- ➕ `tenant_id TEXT NOT NULL REFERENCES tenants(id)` en tabla `order_lines`
- ➕ `last_remote_validation_at TEXT` en tabla `tenants` (requerido por `SqliteTenantRepository.updateSubscription()`)
- 🔧 `orders.status` CHECK expandido (alineado con dominio y Supabase)
- ➕ Índice `idx_order_lines_tenant` agregado
- 📝 Comentario explícito sobre exclusión de `password_hash` por seguridad
- 📝 Header con fecha de sync y referencia al ADR

### 3. `packages/db/src/migrations/migration-runner.ts`

**Razón:** Los dispositivos móviles ya instalados tienen la versión anterior del schema SQLite. Se necesitan migraciones aditivas para actualizar sin reinstalar la app.

Migraciones nuevas:
- `v3`: `ALTER TABLE order_lines ADD COLUMN tenant_id TEXT NOT NULL DEFAULT ''`
- `v4`: `ALTER TABLE tenants ADD COLUMN last_remote_validation_at TEXT`
- `v5`: `ALTER TABLE orders ADD COLUMN currency TEXT NOT NULL DEFAULT 'PEN'`

> **Nota sobre v3:** Se usa `DEFAULT ''` para satisfacer el `NOT NULL` en SQLite durante la migración. PowerSync rellenará el valor correcto al re-sincronizar las filas existentes.

---

## Files Not Changed (and Why)

| Archivo | Razón para no cambiar |
|---|---|
| `packages/domain/src/entities/tenant.ts` | Ya tenía `currency` y `last_remote_validation_at` ✅ |
| `packages/domain/src/entities/order.ts` | Ya tenía el estado completo `OrderStatus` con 6 valores ✅ |
| `packages/domain/src/entities/order-line.ts` | Ya tenía `tenant_id` ✅ |
| `packages/db/src/sqlite/repositories/order-repository.ts` | Ya usaba `tenant_id` en `order_lines` queries ✅ |
| `packages/db/src/sqlite/repositories/tenant-repository.ts` | Ya usaba `last_remote_validation_at` en queries ✅ |
| `packages/db/src/supabase/remote-validator.ts` | No referencia columnas directamente ✅ |
| `packages/sync/src/powersync-schema.ts` | Ya tenía todos los campos correctos ✅ |
| `packages/sync/powersync.yaml` | Ya filtraba por `tenant_id` en `order_lines` ✅ |

---

## Consequences

### Positivas
- ✅ El `schema.sql` ahora es un documento fiel del estado de Supabase. Útil para onboarding, auditorías y recuperación ante desastres.
- ✅ El `sqlite-schema.ts` evita errores de columna faltante en PowerSync (`no such column: tenant_id`).
- ✅ El CHECK de `orders.status` en SQLite y Supabase es consistente con el dominio — no habrá errores de constraint al sincronizar.
- ✅ Las migraciones garantizan que dispositivos con app instalada actualicen sin reinstalar.

### Riesgos mitigados
- 🔒 `password_hash` explícitamente excluido y documentado — sin riesgo de exposición accidental.
- 🔄 Migración v3 usa `DEFAULT ''` temporalmente — PowerSync reescribirá el valor correcto en la próxima sync completa.

### Riesgos residuales
- ⚠️ `tenant_members` **no se agrega a `sqlite-schema.ts` ni a `powersync-schema.ts`** — esta tabla es de autenticación (vincula `auth.users` con tenants) y **no debe replicarse al dispositivo**. Solo se documenta en `schema.sql` para referencia.

---

## References

- Supabase MCP audit realizado el 2026-05-05 (project `lhdqhvrkchbcbfawsgze`)
- `packages/domain/src/entities/order.ts` — Definición de `OrderStatus` y `ORDER_STATUS_TRANSITIONS`
- `packages/sync/powersync.yaml` — Reglas de sync que filtran `order_lines` por `tenant_id`
- Conversación: `a748bd56-ddde-49cd-9d45-536214cfdb6e`
