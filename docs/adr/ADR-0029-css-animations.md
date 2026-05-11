# ADR-0029: Animaciones CSS para la Web

**Fecha:** 2026-05-10  
**Estado:** Completado  
**Autor:** Davier  
**Tags:** `#css` `#animations` `#ux` `#frontend`

---

## Contexto

La webapp se sentía "plana" y sin vida. Las transiciones eran instantáneas sin feedback visual, y no había interacción dinámica al cargar elementos.

Se instaló el skill `css-animations` de heygen-com/hyperframes (14.1K installs) para seguir mejores prácticas de animaciones CSS.

---

## Animaciones Implementadas

### 1. Fade In para página (entrada)

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-wrapper { animation: fadeIn 0.4s ease-out both; }
```

**Ubicación:** Contenido principal al cargar

---

### 2. Stagger para listas

```css
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
/* ... hasta stagger-8 */
```

**Aplicado a:**
- Stat cards del dashboard (4 items)
- Estado del sistema (4 items)

---

### 3. Hover scale para botones

```css
.btn-animate:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

**Aplicado a:** Botón de login (LoginPage.tsx)

---

### 4. Nav link hover

```css
.nav-link:hover { transform: translateX(2px); }
```

**Efecto:** Desplazamiento suave a la derecha al hacer hover

---

### 5. Pulse para indicadores activos

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
.sync-dot { animation: pulse 2s ease-in-out infinite; }
```

**Aplicado a:** Indicador de sync en sidebar

---

### 6. Shimmer para loading

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.loading-shimmer {
  background: linear-gradient(...);
  animation: shimmer 1.5s infinite;
}
```

**Uso futuro:** Estados de carga de datos

---

### 7. Scale in para dropdowns

```css
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95) translateY(-4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.user-dropdown { animation: scaleIn 0.2s ease-out both; }
```

**Aplicado a:** Menú dropdown del header

---

### 8. Slide in para sidebar

```css
@keyframes slideInRight {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}
.sidebar.open { animation: slideInRight 0.3s ease-out; }
```

**Efecto:** El sidebar se desliza desde la izquierda al abrir

---

### 9. Button press feedback

```css
@keyframes buttonPress {
  0%   { transform: scale(1); }
  50%  { transform: scale(0.97); }
  100% { transform: scale(1); }
}
button:not(...):not(...) { animation: buttonPress 0.1s ease; }
```

**Efecto:** Micro-interacción al hacer click

---

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `apps/web/src/index.css` | Agregadas 10 animaciones CSS |
| `apps/web/src/App.tsx` | Clases stagger-1 a stagger-8 en stats y stack, animación fadeIn en statCard y stackRow |
| `apps/web/src/pages/LoginPage.tsx` | Clase btn-animate en botón submit |

---

## Verificación

```bash
npm run typecheck
# Resultado: 14 successful, 14 total ✅
```

---

## Notas

- Las animaciones siguen el patrón del skill css-animations (animation-fill-mode: both, durations finitas, GPU properties)
- Duraciones recomendadas: <300ms para transiciones responsivas
- Preferir `transform` y `opacity` para GPU acceleration
- Las animaciones son subtiles y no intrusivas

---

## Referencias

- Skill: `heygen-com/hyperframes@css-animations`
- Docs: https://skills.sh/heygen-com/hyperframes/css-animations
- MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation