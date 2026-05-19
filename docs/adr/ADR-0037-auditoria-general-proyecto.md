# ADR-0037 — Auditoría General del Proyecto y Decisiones Arquitectónicas

**Fecha:** 2026-05-18
**Status:** Accepted
**Autor:** opencode

---

## Contexto

Se realizó una auditoría completa del monorepo SaaS POS para identificar fricción arquitectónica, deuda técnica y oportunidades de mejora. El proyecto consta de 2 apps (web + mobile) y 6 paquetes compartidos (domain, application, db, sync, ui, utils) organizados con npm workspaces + Turborepo.

## Hallazgos Críticos y Decisiones

### 1. Playwright Port Mismatch
**Problema:** `playwright.config.ts` espera `localhost:5173` pero `vite.config.ts` sirve en `3000`.
**Decisión:** Alinear ambos a puerto `3000` (el configurado en Vite). Playwright debe usar el mismo puerto que el dev server.

### 2. Divergencia de Versiones de React
**Problema:** Web usa React 18.3.1, Mobile usa React 19.1.0. Paquetes compartidos compilados contra versiones distintas.
**Decisión:** Estandarizar en React 19 para todo el monorepo. Mobile ya está en 19; web debe migrar. Eliminar `legacy-peer-deps=true` una vez resuelto.

### 3. TypeScript Deshabilitado en App.tsx
**Problema:** `// @ts-nocheck` en 316 líneas del archivo principal de la web app.
**Decisión:** Eliminar `@ts-nocheck` y corregir los errores de tipo. El problema original era compatibilidad con `NavLink` de react-router-dom v6 — se puede resolver con tipado correcto.

### 4. Sin Linting ni Formatting
**Problema:** Scripts `lint` son stubs. No hay eslint, prettier, ni ningún enforcement de calidad.
**Decisión:** Configurar eslint + prettier a nivel de monorepo con configs compartidas. Incluir en pipeline de CI.

### 5. Sin Configuración Local de Supabase
**Problema:** No existe `supabase/config.toml`. Migraciones se aplican manualmente.
**Decisión:** Crear `supabase/config.toml` con link al proyecto local para desarrollo offline con `supabase start`.

## Hallazgos Moderados

### 6. `@saas-pos/ui` Sin Tests
Único paquete sin framework de testing. Configurar Jest o Vitest con tests de renderizado para componentes cross-platform.

### 7. Duplicación de Config Vitest en Web
Existen dos configuraciones: bloque inline en `vite.config.ts` y archivo `vitest.config.ts` separado. Consolidar en un solo `vitest.config.ts`.

### 8. `react-router-dom` en Mobile
Dependencia web-only innecesaria en `@saas-pos/mobile`. Eliminar — mobile usa expo-router exclusivamente.

### 9. Mobile tsconfig Sobre-inclusivo
`"include": ["../../packages/*/src/**/*.ts"]` captura archivos no intencionales. Restringir a imports explícitos vía `paths`.

### 10. Nomenclatura Inconsistente de ADRs
Mezcla de `ADR-00XX`, `00XX`, `Adr-0015`. Estandarizar a formato `ADR-NNNN` (4 dígitos con padding). Renombrar archivos existentes.

## Hallazgos Menores

- `scratch/` debe documentarse o moverse a `scripts/` con propósito definido
- `exactOptionalPropertyTypes` debería activarse en `tsconfig.base.json`
- Tenant IDs hardcoded en scripts seed deben parametrizarse
- `run-android.ps1` es relicto de Windows — eliminar o documentar

## Estado de Documentación

- **36 ADRs existentes** en `docs/adr/` con buena cobertura de decisiones
- **No existe CONTEXT.md** — recomendado crear para dominio del proyecto
- Documentación operativa presente: `GUIA_ARQUITECTONICA-Y-DEVOPS.md`, `SUPABASE_GUIDE.md`, etc.

## Consecuencias

- Migrar a React 19 en web requiere testing de compatibilidad con librerías (recharts, react-router-dom v6)
- Configurar eslint/prettier generará diffs masivos iniciales — ejecutar como commit separado
- Estandarizar ADRs requiere renombrar ~36 archivos
- Agregar `supabase/config.toml` requiere que el equipo instale Supabase CLI

## Referencias

- ADR-0018: Fase 1 MVP Core POS
- ADR-0024: Estrategia Completa de Testing
- ADR-0026: Arquitectura de Componentes React
- ADR-0036: Rol Barbero y Fixes Mobile
