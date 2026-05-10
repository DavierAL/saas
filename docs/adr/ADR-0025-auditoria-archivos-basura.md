# ADR-0025: Auditoría de Archivos Basura y Residuos

## Estado
**Aprobado** | **Fecha:** 2026-05-10

## Contexto
Proyecto SaaS POS con arquitectura Turborepo (2 apps + 7 paquetes). Se realizó una auditoría completa para identificar archivos innecesarios, pruebas obsoletas, y residuos de desarrollo.

## Auditoría Realizada

### Archivos Eliminados

| # | Archivo | Tamaño | Razón |
|---|---------|--------|-------|
| 1 | `apps/web/src/__tests__/useTenant.test.tsx.bak` | 3.9 KB | Backup obsoleto de tests para hook que cambió de implementación |
| 2 | `apps/mobile/typecheck.log` | 28.6 KB | Log temporal de errores de compilación |
| 3 | `apps/web/playwright-report/` | ~2.2 MB | Reportes E2E binarios - no belong al repo |
| 4 | `design-md/` (todo el directorio) | ~40 KB | Documentación de inspiración de diseño no utilizada |
| 5 | `packages/sync/src/__tests__/dummy.test.ts` | 95 B | Test boilerplate sin lógica real |
| 6 | `apps/web/src/__tests__/dummy.test.ts` | 118 B | Test boilerplate sin lógica real |
| 7 | `apps/mobile/src/__tests__/dummy.test.ts` | 118 B | Test boilerplate sin lógica real |
| 8 | `apps/web/public/vite.svg` | - | Logo default de Vite no utilizado |

### Dependencias Removidas

| Paquete | Ubicación | Razón |
|---------|-----------|-------|
| `expo-camera` | `package.json` raíz | Solo referencedo en mensaje de texto, no usado realmente |

### Actualizaciones a .gitignore

Agregadas entradas:
- `playwright-report/`
- `test-results/`

(La entrada `*.log` ya existía)

---

## Impacto

### Espacio Recuperado
- **~2.5 MB** netos eliminados
- Archivos de cache .turbo/*.log (redundantes)
- Reportes E2E (~2.2 MB)

### Mejoras en Mantenibilidad
- Eliminación de tests boilerplate que generaban ruido
- Directorio de diseño inspiration obsoleto removido
- Dependencia no utilizada eliminada del raíz

---

## Notas

### Archivos Revisados pero Conservados

| Archivo | Razón |
|---------|-------|
| `apps/web/src/test/` | Estructura alternativa de tests (Vitest) vs `__tests__/` (Jest) |
| `docs/adr/0002-0010` | ADR antiguos - verificar implementación antes de archivar |

### Pendiente de Revisión Futura
- Unificar estructura de tests en web app (`test/` vs `__tests__/`)
- Evaluar archival de ADRs antiguos (0002-0010)

---

## Referencias

- Commit previo: TypeScript fixes (29 errores)
- Seguridad: Remedio de credenciales expuestas en .env files