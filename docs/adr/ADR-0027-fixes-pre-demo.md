# ADR-0027: Corrección de Bugs Críticos Pre-Demo

**Fecha:** 2026-05-10  
**Estado:** Completado  
**Autor:** Davier  
**Tags:** `#bugfix` `#security` `#demo`

---

## Contexto

Antes de realizar una demo a un cliente real (barbería), se realizó una auditoría del proyecto para evaluar el estado de готовность. Se identificaron dos bugs críticos que debían resolverse:

1. **BUG-003**: console.log exponiendo datos sensibles (tenant_id, analytics) en producción web
2. **BUG-002**: Pantalla en blanco sin feedback durante la inicialización de la base de datos en mobile

---

## Decisiones

### BUG-003: Eliminación de console.log con datos sensibles

**Problema:**  
Las líneas 64 y 69 de `AnalyticsPage.tsx` ejecutaban `console.log` del `tenantId` y datos de respuesta de analytics. En producción del navegador, estos datos son visibles en la consola de DevTools, representando un riesgo de seguridad.

**Solución adoptada:**  
Eliminar completamente los dos console.log:

```diff
- // eslint-disable-next-line no-console
- console.log("Fetching analytics for tenant:", tenantId);
  useCases.orders.getAnalytics(tenantId).then((res) => {
-   // eslint-disable-next-line no-console
-   console.log("Analytics result:", res);
    setData(res);
```

**Archivos modificados:**
- `apps/web/src/pages/AnalyticsPage.tsx` (líneas 62-69)

---

### BUG-002: Mejora del feedback de loading en mobile

**Problema:**  
En `apps/mobile/app/index.tsx`, cuando el usuario iniciaba sesión pero la base de datos aún se estaba inicializando (`isDbReady = false`), el componente mostraba únicamente un `ActivityIndicator` genérico sin mensaje explicativo, resultando en una experiencia de "pantalla en blanco" confusa.

**Solución adoptada:**  
Mejorar el componente para mostrar mensajes contextuales según el estado:

```typescript
const getLoadingMessage = () => {
  if (isLoading) return 'Iniciando sesión...';
  if (!isDbReady) return 'Preparando base de datos...';
  if (!hasSynced) return 'Sincronizando datos...';
  return 'Cargando...';
};
```

- Se añadió `hasSynced` del contexto de Auth para dar feedback de sincronización
- Se creó un componente visual con texto descriptivo usando tokens de diseño existentes

**Archivos modificados:**
- `apps/mobile/app/index.tsx` (componente completo)

---

## Consecuencias

| Aspecto | Impacto |
|---------|---------|
| **Seguridad** | BUG-003 resuelto - sin exposición de datos sensibles en consola |
| **UX Mobile** | BUG-002 resuelto - usuario recibe feedback claro durante carga |
| **TypeScript** | Todos los tipos verificados - typecheck pasa |
| **Compatibilidad** | Sin cambios en API pública |

---

## Verificación

```bash
npm run typecheck
# Resultado: 14 successful, 14 total ✅
```

---

## Notas

- Estos fixes fueron identificados durante la auditoría pre-demo descrita en el análisis "Estado del Proyecto para Demo a Barbería"
- El BUG-002 no era técnicamente una "pantalla en blanco" literal, sino un loading genérico que no comunicaba progreso al usuario
- Ambos cambios son backward-compatible y no requieren migración de datos

---

## Referencias

- Análisis pre-demo: revisión de estado del proyecto para presentación a cliente
- Docs: `docs/ALCANCES_Y_REQUERIMIENTOS.md` sección 7.1 (bugs críticos pendientes)
- Docs: `docs/PLAN_MOBILE.md` sección 3.1 (BUG-001, BUG-002, BUG-003)