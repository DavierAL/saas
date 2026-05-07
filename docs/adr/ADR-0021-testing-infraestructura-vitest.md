# ADR-0021: Configuración de Infraestructura de Testing con Vitest

## Estado
**Aprobado** | Fecha: 2026-05-06

## Contexto
El proyecto SaaS POS carece de una estrategia de testing estructurada para la capa web (apps/web). La aplicación React/Vite no tenía configuración adecuada de testing, lo cual genera:
- Incapacidad de detectar regresiones
- Tests que fallan silenciosamente
- Alta probabilidad de bugs en producción
- Sin cobertura de código verificable

## Decisión
Se implementó una infraestructura de testing completa usando Vitest 4 como framework principal, compatible con la arquitectura del monorepo Turborepo.

### Tecnologías Seleccionadas
- **Vitest 4.1.5**: Framework de testingunificado (reemplaza Jest disperso previamente usado)
- **@testing-library/react 14.2.1**: Testing de componentes React
- **@testing-library/jest-dom 6.9.1**: Matchers personalizados para Jest/Vitest
- **@testing-library/user-event 14.5.2**: Simulación de interacciones de usuario
- **jsdom 24.0.0**: Environment para testing en Node

## Justificación

### 1. Vitest sobre Jest
| Criterio | Vitest | Jest |
|----------|--------|------|
| Integración con Vite | ✅ Nativa | ⚠️ Requiere config |
| Velocidad | ✅ Faster (mismo equipo de Vite) | ✅ Rápido |
| API compatible | ✅ 95% compatible | N/A |
| Soporte TS | ✅ Nativo | ⚠️ Requiere ts-jest |
| Estado activo | ✅ Desarrollo activo | ⚠️ Mantenido |

**Justificación**: Vitest partage la misma configuración que Vite, reduciendo overhead de mantenimiento y aprovechando el mismo ecosistema de plugins y configuración.

### 2. Testing Library sobre Testing Utilidades Propias
- **Menor acoplamiento**: Los tests dependen del comportamiento del usuario, no de la implementación
- **Mantenibilidad**: Los refactors no rompen tests innecesariamente
- **Documentación extensa**: Comunidad grande y bien establecida
- **Accesibilidad probada**: Queries basados en roles accesibles por defecto

### 3. Estructura de Test Centralizada
```
src/
├── test/
│   ├── setup.ts          # Mocks globales (Supabase, use-cases, etc.)
│   ├── types.ts          # Tipos personalizados
│   ├── index.ts          # Exports públicos
│   └── test-utils/
│       ├── render.tsx    # Render con Router
│       └── builders.ts   # Builders para entidades
└── __tests__/            # Tests existentes
```

**Beneficios**:
- Mocks centralizados y consistentes
- Reutilización de builders para entidades de dominio
- Render wrapper con BrowserRouter para tests de páginas

### 4. Configuración de Coverage Progresivo
```json
{
  "lines": 50,
  "functions": 50,
  "branches": 40,
  "statements": 50
}
```

**Justificación**: Thresholds conservadores permiten adopción gradual sin bloquear desarrollo. Se aumentarán progresivamente hasta alcanzar 70%.

## Consecuencias

### Positivas
- ✅ Tests unitarios ejecutándose correctamente (20 tests passing)
- ✅ Mocks de Supabase y use-cases disponibles globalmente
- ✅ API consistente con el resto del monorepo (packages usan Jest pero web usa Vitest)
- ✅ Scripts de npm disponibles: `test`, `test:watch`, `test:coverage`, `test:ui`
- ✅ Tests de componentes React posibles con environment jsdom

### Negativas
- ⚠️ Inconsistencia temporal: packages usan Jest, web usa Vitest (aceptable por separación)
- ⚠️ Windows pool issue: configurado `thread: false` para compatibilidad (puede afectar performance)
- ⚠️ Migración de tests existentes de packages requerida si se unifica framework

### Riesgos Mitigados
| Riesgo | Mitigación |
|--------|-------------|
| Tests no ejecutan | Configuración verificada, 20 tests passing |
| Mocks incompletos | Setup con Supabase, use-cases, localStorage, sessionStorage, matchMedia |
| Compatibilidad Windows | Pool configurado para single-thread mode |

## Criterios de Éxito
- [x] Vitest configurado correctamente en vite.config.ts
- [x] Tests ejecutan sin errores (20/20 passing)
- [x] Mocks globales disponibles para Supabase y use-cases
- [x] Coverage reporting configurado con thresholds progresivos
- [x] Scripts de npm disponibles para diferentes flujos de testing

## Siguientes Pasos Recomendados
1. **Inmediato**: Crear tests de componentes (AuthGuard, ErrorBoundary, Hooks)
2. **Corto plazo**: Tests de páginas críticas (Login, Orders, Catalog)
3. **Mediano plazo**: Configurar E2E con Playwright
4. **Largo plazo**: Unificar framework de testing del monorepo

## Referencias
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library - React](https://testing-library.com/docs/react-testing-library/intro/)
- [Configuración de Vitest con React](https://vitest.dev/config/#working-with-react)
- [Migración de Jest a Vitest](https://vitest.dev/guide/migration.html)