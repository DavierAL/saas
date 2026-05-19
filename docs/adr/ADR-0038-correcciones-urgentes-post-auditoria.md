# ADR-0038 — Correcciones Urgentes Post-Auditoría

**Fecha:** 2026-05-18
**Status:** Accepted
**Autor:** opencode

---

## Contexto

Tras la auditoría general del proyecto (ADR-0037), se identificaron varias correcciones urgentes que podían aplicarse sin riesgo de romper funcionalidad existente. Este ADR documenta los cambios realizados.

## Cambios Realizados

### 1. Playwright Port Mismatch Corregido
**Archivos:** `apps/web/playwright.config.ts`

**Cambio:** `baseURL` y `webServer.url` cambiados de `localhost:5173` a `localhost:3000`.

**Por qué:** El dev server de Vite está configurado en puerto 3000 (`vite.config.ts:server.port`). Playwright intentaba conectarse al puerto 5173 (puerto por defecto de Vite) que no existía, causando que los tests E2E fallaran al arrancar. Este cambio no afecta la app en sí, solo los tests.

### 2. Eliminado `@ts-nocheck` de App.tsx
**Archivos:** `apps/web/src/App.tsx`

**Cambios:**
- Eliminado `// @ts-nocheck` de la línea 1
- Renombrado `NavLink as RouterNavLink` → `NavLink` directamente
- Agregado tipo de retorno explícito `CSSProperties` a `navLinkStyle`
- Agregados imports de tipos: `CSSProperties` de React, `NavLinkProps` de react-router-dom

**Por qué:** 316 líneas del archivo principal de la web app estaban completamente sin verificación de tipos. El comentario original mencionaba un problema de compatibilidad con `NavLink` de react-router-dom v6, pero el problema era simplemente falta de tipado correcto en la función `style`. Con el tipo de retorno explícito, TypeScript puede verificar correctamente las 316 líneas.

### 3. Consolidada Configuración Duplicada de Vitest
**Archivos:** `apps/web/vite.config.ts`, `apps/web/vitest.config.ts`

**Cambios:**
- `vitest.config.ts` ahora contiene toda la configuración de test + los alias de resolve (antes solo estaban en `vite.config.ts`)
- `vite.config.ts` eliminado el bloque `test` inline y los alias de resolve (redundantes)
- `vite.config.ts` ahora solo contiene configuración del servidor Vite (plugins + server.port)

**Por qué:** Existían dos configuraciones de Vitest con valores contradictorios:
- `vite.config.ts` tenía setup en `./src/test/setup.ts`, coverage thresholds, y incluía `src/**/*.test.{ts,tsx}`
- `vitest.config.ts` tenía setup en `./src/__tests__/setup.ts` y solo incluía `src/__tests__/**/*.test.{ts,tsx}`

Dependiendo de cómo se invocara vitest, se usaba una configuración u otra, causando comportamiento inconsistente. Ahora hay una sola fuente de verdad.

### 4. Eliminado `react-router-dom` de Mobile
**Archivos:** `apps/mobile/package.json`

**Cambio:** Removida dependencia `"react-router-dom": "6.30.3"` de las dependencies de mobile.

**Por qué:** La app mobile usa `expo-router` para file-based routing. Ningún archivo en `apps/mobile/` importa de `react-router-dom` (verificado con grep). Era una dependencia huérfana que aumentaba el bundle size innecesariamente y podía causar conflictos con la divergencia de versiones de React.

## Riesgos Evaluados

| Cambio | Riesgo | Mitigación |
|--------|--------|------------|
| Playwright port | Bajo | Solo afecta tests E2E, no la app |
| @ts-nocheck removal | Bajo | Solo agrega verificación de tipos, no cambia runtime |
| Vitest consolidation | Bajo | Unifica configuraciones existentes, no cambia comportamiento |
| react-router-dom removal | Ninguno | No se usa en ningún archivo de mobile |

## Consecuencias

- Tests E2E de Playwright ahora pueden arrancar correctamente
- App.tsx ahora tiene verificación completa de TypeScript
- Configuración de Vitest es predecible y única
- Mobile tiene una dependencia menos que mantener
- Para aplicar estos cambios en un entorno real, ejecutar `npm install` para actualizar `package-lock.json`

## Referencias

- ADR-0037: Auditoría General del Proyecto
- ADR-0022: Testing E2E con Playwright
- ADR-0021: Testing Infraestructura Vitest
