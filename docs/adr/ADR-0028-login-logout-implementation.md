# ADR-0028: Implementación de Login/Logout en Web

**Fecha:** 2026-05-10  
**Estado:** Completado  
**Autor:** Davier  
**Tags:** `#auth` `#ux` `#logout` `#security`

---

## Contexto

Durante la auditoría pre-demo se identificó que:
- El **login** existía y funcionaba correctamente (`LoginPage.tsx` con `supabase.auth.signInWithPassword`)
- El **logout NO estaba implementado** - no había ningún botón, función ni opción visible en la UI de la web
- La sidebar solo tenía navegación a páginas sin opción de cerrar sesión
- El header del móvil solo mostraba "SaaS POS" sin usuario ni menú

---

## Decisiones

### Opción A: Botón de logout en Sidebar

**Implementación:**
- Agregar botón "Cerrar sesión" al final del sidebar, antes del estado de sync
- Usar icono `⏻` (símbolo de apagado)
- Estilizado consistente con los demás elementos de navegación

```tsx
<button onClick={onLogout} style={s.logoutButton}>
  <span style={s.logoutIcon}>⏻</span>
  <span>Cerrar sesión</span>
</button>
```

**Propiedades agregadas a `Sidebar`:**
- `onLogout: () => void` - función pasada como prop

---

### Opción B: Menú de usuario en Header

**Implementación:**
- Mostrar avatar con inicial del email del usuario logueado
- Click abre dropdown con email y opción de logout
- Cerrar dropdown al hacer click fuera

```tsx
const [session, setSession] = useState<Session | null>(null);
const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

// Mostrar inicial del email
<span style={s.userAvatar}>{userEmail.charAt(0).toUpperCase()}</span>
```

**Funcionalidades:**
- Sesión sincronizada con Supabase en tiempo real
- Dropdown con email visible y botón de logout
- Cerrar menú al hacer click fuera (useEffect)

---

### Función de logout

```tsx
const handleLogout = useCallback(async () => {
  await supabase.auth.signOut();
  navigate('/login', { replace: true });
}, [navigate]);
```

- Usa `supabase.auth.signOut()` para cerrar sesión
- Redirige a `/login` con `replace: true` para evitar volver atrás
- Envuelta en `useCallback` para estabilidad de referencias

---

## Cambios Realizados

### Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `apps/web/src/App.tsx` | Agregado estado session, función logout, props en Sidebar, menú dropdown en header |
| `apps/web/src/index.css` | Agregado `position: relative` a `.mobile-header` |

### Nuevas dependencias
- `Session` de `@supabase/supabase-js` - para tipado de sesión
- `useNavigate` de `react-router-dom` - para redirección tras logout
- `supabase` de `./lib/supabase` - para signOut y getSession

---

## Verificación

```bash
npm run typecheck
# Resultado: 14 successful, 14 total ✅
```

---

## UI Resultante

### Sidebar (desktop)
```
┌─────────────────┐
│ 🔵 SaaS POS     │
├─────────────────┤
│ ◼ Overview      │
│ ◈ Catálogo      │
│ ...             │
│ ◬ Ajustes       │
├─────────────────┤
│ ⏻ Cerrar sesión │  ← NUEVO
│ ● Supabase·Online│
└─────────────────┘
```

### Header (mobile)
```
┌─────────────────────────────┐
│ ☰  SaaS POS          [A]   │  ← Click abre dropdown
└─────────────────────────────┘
         │
         ▼ (dropdown)
┌─────────────────────────────┐
│ usuario@email.com          │
├─────────────────────────────┤
│ Cerrar sesión              │
└─────────────────────────────┘
```

---

## Notas

- La implementación sigue las mejores prácticas de React (useCallback para callbacks estables, useEffect para side effects)
- El logout es consistente en ambas ubicaciones (sidebar y dropdown)
- El estado de sesión se mantiene sincronizado con Supabase
- El dropdown se cierra automáticamente al hacer click fuera (mejora UX)

---

## Referencias

- Archivo original de login: `apps/web/src/pages/LoginPage.tsx`
- Componente AuthGuard: `apps/web/src/components/AuthGuard.tsx`
- Skill: `vercel-react-best-practices` (reglas: rerender-memo, rerender-functional-setstate)