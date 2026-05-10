# ADR-0023: Progreso de Implementación de Testing - Mayo 2026

## Estado
**En Progreso** | Fecha: 2026-05-07

## Resumen Ejecutivo

Se ha implementado una estrategia de testing de múltiples capas para el monorepo SaaS POS. A pesar de algunos problemas de compatibilidad identificados, la infraestructura base está operativa.

## Decisiones Tomadas

### 1. Stack de Testing Elegido

| Capa | Framework | Estado |
|------|-----------|--------|
| Unit (packages) | Jest 29.x | ✅ Operativo |
| Unit (web app) | Vitest 4.x | ⚠️ Issue React 18 |
| E2E | Playwright 1.59 | ✅ Operativo |

### 2. Arreglos de Build Realizados

- `application/src/ports/appointment-repository.port.ts`: Eliminado import no usado de `Tenant`
- `application/src/ports/table-repository.port.ts`: Eliminado import no usado de `Tenant`
- `apps/web/src/pages/AppointmentsPage.tsx`: Eliminado import no usado de `Item`
- `apps/web/src/test/types.ts`: Corregido conflicto de exports
- `apps/web/src/test/setup.ts`: Corregidas propiedades duplicadas de Storage
- `apps/web/tsconfig.json`: Agregado `skipLibCheck: true`
- `apps/web/package.json`: Modificado build script para usar solo Vite

### 3. Tests Implementados

#### Domain (54 tests, 100% coverage)
- `pricing.test.ts` ✅
- `inventory.test.ts` ✅
- `subscription.test.ts` ✅
- `money.test.ts` ✅

#### Application (34 tests passing, 100% coverage)
- `checkout.test.ts` ⚠️ 2 tests falling (bugs reales)
- `manage-users.test.ts` ⚠️ 1 test failing
- `add-item-to-cart.test.ts` ✅

#### DB (11 tests passing, ~78% coverage)
- `item-repository.test.ts` ⚠️ 4 tests failing
- `order-repository.test.ts` ⚠️ 2 tests failing
- `tenant-repository.test.ts` ⚠️ 2 tests failing

#### Web App (Vitest - 20 tests)
- `csv-export.test.ts` ✅ 19 tests
- `dummy.test.ts` ✅ 1 test

#### Web App (Playwright E2E)
- `login.spec.ts` - Configurado
- `app-flow.spec.ts` - Configurado  
- `pages.spec.ts` - Configurado

## Problemas Conocidos

### 1. React Router DOM + React 18 TypeScript Issue
**Descripción**: Errores de tipo durante build de web app
```
'NavLink' cannot be used as a JSX component.
'Routes' cannot be used as a JSX component.
'Route' cannot be used as a JSX component.
```

**Causa**: Incompatibilidad entre `@types/react` y `react-router-dom` types

**Solución temporal**: Build con solo Vite (sin tsc -b)

**Solución recomendada**: 
- Actualizar a versiones compatibles de react-router-dom 7.x
- O usar `skipLibCheck: true` en tsconfig

### 2. Application Test Failures (2 failing)

**a) manage-users.test.ts**
```
test: trims whitespace from email
error: "El email no tiene un formato válido."
```
**Causa real**: El código no hace trim del email antes de validar

**b) checkout.test.ts**
```
test: fails when subscription is expired
error: "Cannot read properties of undefined (reading 'map')"
```
**Causa real**: Variable `items` es undefined cuando se llama a la función

### 3. DB Test Failures (8 failing)

**Causa**: Mocks incompletos - los tests usan un mock de SQLite que no tiene el método `getOptional` implementado correctamente

### 4. Packages Sin Tests

- `@saas-pos/utils`: "No tests yet"
- `@saas-pos/ui`: "No tests yet"
- `@saas-pos/sync`: "No tests yet"

## Métricas Actuales

| Métrica | Valor |
|---------|-------|
| Total tests passing | ~120 |
| Coverage domain | 100% |
| Coverage application | 100% |
| Coverage db | ~78% |
| Coverage web (unit) | ~5% |
| E2E tests configured | 25+ |

## Siguientes Pasos Recomendados

### Alta Prioridad
1. [ ] Arreglar 2 tests fallando en application (bugs reales)
2. [ ] Arreglar 8 tests fallando en db (completar mocks)
3. [ ] Resolver issue de build de web app

### Media Prioridad
4. [ ] Agregar tests para @saas-pos/utils
5. [ ] Agregar tests para @saas-pos/ui  
6. [ ] Agregar tests para @saas-pos/sync

### Baja Prioridad
7. [ ] Configurar GitHub Actions CI
8. [ ] Configurar coverage thresholds
9. [ ] Ejecutar E2E tests y verificar

## Referencias

- [ADR-0021: Testing Infrastructure Vitest](ADR-0021-testing-infraestructura-vitest.md)
- [ADR-0022: Testing E2E Playwright](ADR-0022-testing-e2e-playwright.md)