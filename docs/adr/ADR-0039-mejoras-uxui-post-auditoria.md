# ADR-0039 — Mejoras UX/UI Post-Auditoría

**Fecha:** 2026-05-18
**Status:** Accepted
**Autor:** opencode

---

## Contexto

Tras la auditoría UX/UI completa (score 9/20 audit, 16/40 heuristics), se ejecutó un plan de mejoras priorizadas por severidad (P0-P3). Este ADR documenta todos los cambios realizados y su justificación.

## Cambios Realizados

### P0 — Blocking (2 fixes)

#### 1. Variables CSS faltantes definidas
**Archivos:** `apps/web/src/index.css`

**Cambio:** Agregadas `--bg-app`, `--bg-base`, `--bg-elevated` a ambos temas (dark y light).

**Por qué:** `LoginPage.tsx`, `OrdersPage.tsx`, y `UsersPage.tsx` usaban `var(--bg-app)` y `var(--bg-base)` que no existían en `:root`. Los fondos se renderizaban transparentes/incorrectos, rompiendo la apariencia visual de 3 páginas críticas.

#### 2. Rol "barber" agregado al filtro de UsersPage
**Archivos:** `apps/web/src/pages/UsersPage.tsx`

**Cambio:** Agregada opción `<option value="barber">Barbero</option>` al select de filtro de roles.

**Por qué:** El rol `barber` es válido del sistema (ADR-0036) pero estaba ausente del filtro. Los usuarios con rol barbero no aparecían al filtrar, causando confusión.

### P1 — Major (5 fixes)

#### 3. Componente `<ErrorBanner>` compartido
**Archivos creados:** `apps/web/src/components/ErrorBanner.tsx`
**Archivos modificados:** `CatalogPage.tsx`, `OrdersPage.tsx`, `UsersPage.tsx`

**Cambio:** Creado componente reutilizable `<ErrorBanner>` con estilos consistentes usando CSS variables. Reemplazadas 3 implementaciones distintas de error banners que usaban colores hardcodeados (`#7F1D1D`, `#EF4444`, `#FCA5A5`).

**Por qué:** Tres variantes de error banner rompían consistencia visual. Cada página tenía su propia implementación con colores fijos que no respondían al tema dark/light. El componente compartido usa `var(--error-bg)`, `var(--error-border)`, `var(--error-color)` y elimina ~30 líneas de código duplicado.

#### 4. Emojis reemplazados por iconos SVG y texto limpio
**Archivos modificados:** `App.tsx`, `AnalyticsPage.tsx`, `InventoryPage.tsx`, `CustomersPage.tsx`, `CashClosingPage.tsx`, `AppointmentsPage.tsx`
**Archivos creados:** `apps/web/src/components/PageIcon.tsx`

**Cambios:**
- Sidebar: Emojis Unicode (◼, ◈, ◉, 💳, 🪑, 📅, 👥) reemplazados por texto limpio
- Títulos de página: 🧾 📊 📦 👥 ✂️ eliminados
- Stat cards: Emojis decorativos removidos, layout simplificado a label + value
- Export buttons: 📥 eliminado
- Chart titles: 💹 🏆 🍕 eliminados
- Empty states: 👥 eliminado de CustomersPage

**Por qué:** Los emojis como sistema de iconografía son el tell #1 de UI generada por AI. Crean inconsistencia visual (renderizan diferente en cada OS/browser), problemas de accesibilidad (screen readers los leen literalmente), y dan apariencia amateur. El componente `PageIcon` proporciona SVGs inline consistentes para las páginas que los necesitan.

#### 5. Colores hardcodeados migrados a CSS variables en AnalyticsPage
**Archivos:** `apps/web/src/pages/AnalyticsPage.tsx`

**Cambios:**
- `#333` → `var(--border-color)` (CartesianGrid stroke)
- `#2b0d0d` → `var(--error-border)` (error card border)
- `#8884d8` → `ACCENT` (PieChart default fill)
- `border: 1px solid #333` → `border: 1px solid var(--border-color)` (SummaryCard, ChartContainer)

**Por qué:** 6+ colores hardcodeados en AnalyticsPage ignoraban el sistema de temas. Los gráficos de Recharts y los contenedores usaban colores fijos que no se adaptaban al dark/light mode.

#### 6. Side-stripe borders eliminados (anti-pattern)
**Archivos:** `AnalyticsPage.tsx`, `AppointmentsPage.tsx`

**Cambios:**
- AnalyticsPage warning banner: removido `borderLeft: 4px solid`
- AnalyticsPage footer note: removido `borderLeft: 3px solid`, reemplazado con border completo
- AppointmentsPage appointment cards: cambiado de `borderLeft` a `borderTop` con 2px

**Por qué:** Side-stripe borders (`border-left` > 1px como accent) están en la lista de absolute bans del skill impeccable. Son decorativos sin significado funcional. Los bordes completos o background tints comunican mejor el estado.

#### 7. Animaciones CSS costosas eliminadas
**Archivos:** `apps/web/src/index.css`

**Cambios:**
- Removida animación `buttonPress` global que se ejecutaba en TODOS los botones al montarse
- Removida animación `fadeToggle` no utilizada
- Eliminados `box-shadow` de hover states (causa repaint costoso)

**Por qué:** La animación `buttonPress` (`scale(0.97)`) se ejecutaba en cada botón al montar, causando jank innecesario en toda la app. Los `box-shadow` en hover causan repaint en lugar de composite-only animation. Solo `transform` y `opacity` deben animarse.

### P2 — Minor (4 fixes)

#### 8. "Dismiss" → "Cerrar" en error banners
**Archivos:** `CatalogPage.tsx`, `OrdersPage.tsx`, `UsersPage.tsx` (vía ErrorBanner component)

**Por qué:** Texto en inglés en aplicación completamente en español rompe inmersión del usuario.

#### 9. Mobile retry button con handler
**Archivos:** `apps/mobile/app/(tabs)/index.tsx`

**Cambio:** Agregado `onPress` al botón "Reintentar" del estado de error del catálogo.

**Por qué:** El botón existía visualmente pero no tenía handler. Era un dead element que frustraba al usuario.

#### 10. Texto "barbería" hardcodeado corregido
**Archivos:** `apps/web/src/pages/CustomersPage.tsx`

**Cambio:** "Agrega clientes para gestionar tu barbería" → "Agrega clientes para gestionar tu negocio"

**Por qué:** La app soporta retail, restaurant, y barbershop. El texto hardcodeado excluía a 2 de 3 industrias.

### P3 — Polish (1 fix)

#### 11. Fuente Inter importada correctamente
**Archivos:** `apps/web/index.html`

**Cambio:** Agregados `<link>` tags para Google Fonts (Inter 400-800).

**Por qué:** `index.css` declaraba `font-family: 'Inter'` pero la fuente nunca se cargaba. El fallback a system fonts podía verse diferente al diseño intencional.

## Impacto Medible

| Métrica | Antes | Después |
|---------|-------|---------|
| Variables CSS undefined | 3 (`--bg-app`, `--bg-base`, `--bg-elevated`) | 0 |
| Error banner variants | 3 implementaciones distintas | 1 componente compartido |
| Emojis en web UI | 25+ en 8 páginas | 0 |
| Colores hardcodeados en AnalyticsPage | 6+ | 0 |
| Side-stripe borders | 3 instancias | 0 |
| Animaciones globales costosas | 2 (`buttonPress`, `box-shadow` hover) | 0 |
| Textos en inglés en app español | 3 ("Dismiss") | 0 |
| Dead UI elements | 1 (retry button) | 0 |
| Fuente no cargada | Inter sin import | Importada vía Google Fonts |

## Archivos Creados

- `apps/web/src/components/ErrorBanner.tsx` — Componente compartido de error
- `apps/web/src/components/PageIcon.tsx` — Iconos SVG para títulos de página

## Archivos Modificados (14)

- `apps/web/src/index.css` — Variables CSS, animaciones
- `apps/web/index.html` — Google Fonts import
- `apps/web/src/App.tsx` — Sidebar sin emojis, estilos limpiados
- `apps/web/src/pages/CatalogPage.tsx` — ErrorBanner, estilos
- `apps/web/src/pages/OrdersPage.tsx` — ErrorBanner, emoji removido
- `apps/web/src/pages/UsersPage.tsx` — ErrorBanner, filtro barber
- `apps/web/src/pages/InventoryPage.tsx` — PageIcon, stat cards limpios
- `apps/web/src/pages/AnalyticsPage.tsx` — Colores, emojis, side-stripes
- `apps/web/src/pages/CashClosingPage.tsx` — Emoji removido
- `apps/web/src/pages/CustomersPage.tsx` — Emojis, texto genérico
- `apps/web/src/pages/AppointmentsPage.tsx` — Side-stripe → top border
- `apps/mobile/app/(tabs)/index.tsx` — Retry button handler

## Riesgos Evaluados

| Cambio | Riesgo | Mitigación |
|--------|--------|------------|
| CSS variables nuevas | Bajo | Solo agregan valores faltantes, no cambian existentes |
| ErrorBanner component | Bajo | Mismo comportamiento visual, solo unifica estilos |
| Emojis → texto/SVG | Bajo | Mejora legibilidad, no cambia funcionalidad |
| Colores → variables | Bajo | Mismos colores en dark mode, ahora responsive a light |
| Animaciones removidas | Bajo | Solo elimina efectos decorativos, no funcionales |
| Inter font import | Bajo | Font loading es async, fallback a system fonts mientras carga |

## Consecuencias

- La app ahora tiene consistencia visual en error handling, iconografía y colores
- Dark/light mode funciona correctamente en todas las páginas modificadas
- Performance mejorado al eliminar animaciones globales innecesarias
- Accesibilidad mejorada al remover emojis de elementos semánticos
- Código más mantenible con componentes compartidos
- Para aplicar: ejecutar `npm install` para actualizar dependencias

## Referencias

- ADR-0037: Auditoría General del Proyecto
- ADR-0038: Correcciones Urgentes Post-Auditoría
- ADR-0036: Rol Barbero y Fixes Mobile
- ADR-0029: CSS Animations
