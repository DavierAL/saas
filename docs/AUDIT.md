# Audit Completo — SaaS POS

**Fecha:** 2026-04-27 | **Branch:** `main` | **Autor:** Claude Sonnet 4.6  
**Stack:** React Native + Expo · React + Vite · Supabase + PowerSync · Turborepo

---

## Resumen Ejecutivo

| Categoría | Crítico | Alto | Medio | Bajo |
|---|---|---|---|---|
| Bugs | 3 | 3 | 4 | — |
| Seguridad | 2 | 1 | — | — |
| UI/UX | — | 3 | 5 | 3 |
| Deuda técnica | — | — | 3 | — |
| **Total** | **5** | **7** | **12** | **3** |

---

## 1. Bugs Críticos

### BUG-001 · `user_id` hardcodeado en todas las órdenes

**Archivo:** `apps/mobile/src/hooks/useCheckout.ts:39`  
**Severidad:** 🔴 Crítico  

```ts
// ❌ Actual
user_id: 'demo-user-id',  // Phase 3 will use real auth user

// ✅ Fix
const { tenantId, session } = useAuth();
// ...
user_id: session?.user?.id ?? 'unknown',
```

Todas las órdenes de todos los tenants se crean con `user_id = 'demo-user-id'`. No hay trazabilidad de qué cajero procesó cada venta. Es un bug activo en producción.

---

### BUG-002 · Pantalla en blanco sin indicador mientras la DB inicializa

**Archivo:** `apps/mobile/src/providers/AppProvider.tsx:144-146`  
**Severidad:** 🔴 Crítico  

```tsx
// ❌ Actual — renders null, pantalla completamente en blanco
if (!db) return null;

// ✅ Fix
if (!db) return <LoadingScreen message="Iniciando base de datos..." />;
// + exponer el estado de error del catch al UI
```

En el primer login, después de autenticarse, el usuario ve pantalla en blanco mientras PowerSync inicializa. Si `initDatabase()` falla, el error sólo se logea en consola — el usuario nunca ve mensaje de error.

---

### BUG-003 · `console.log` con datos sensibles en producción

**Archivo:** `apps/web/src/pages/AnalyticsPage.tsx:59,62`  
**Severidad:** 🔴 Crítico (Seguridad)  

```ts
// ❌ Eliminar ambas líneas
console.log("Fetching analytics for tenant:", tenantId);  // expone tenant ID
console.log("Analytics result:", res);                     // expone todos los datos de ventas
```

El `tenantId` y todos los datos de ventas de los últimos 30 días son visibles en la consola del navegador de cualquier persona que abra DevTools.

---

## 2. Bugs Altos

### BUG-004 · Validación JWT con `includes()` es bypasseable

**Archivo:** `apps/mobile/src/providers/AppProvider.tsx:57`  
**Severidad:** 🟠 Alto (Seguridad)  

```ts
// ❌ Actual — un token con iss: "attacker.com?x=abc.supabase.co" pasaría
if (!payload.iss.includes(supabaseHost)) { return null; }

// ✅ Fix — comparación exacta usando URL parsing
const issHost = new URL(payload.iss as string).hostname;
const expectedHost = new URL(supabaseUrl).hostname;
if (issHost !== expectedHost) return null;
```

---

### BUG-005 · `loadMore` marca loading completado antes de que los datos lleguen

**Archivo:** `apps/mobile/app/(tabs)/orders.tsx:139-148`  
**Severidad:** 🟠 Alto  

```ts
// ❌ Actual — setLoadingMore(false) corre inmediatamente, no al completar
setTimeout(() => {
  loadMore();
  setLoadingMore(false);
}, 150);

// ✅ Fix
const handleEndReached = useCallback(async () => {
  if (!hasMore || loadingMore || search) return;
  setLoadingMore(true);
  try { await loadMore(); }
  finally { setLoadingMore(false); }
}, [hasMore, loadingMore, search, loadMore]);
```

El spinner de carga desaparece a los 150ms aunque los datos aún no hayan llegado. El `setTimeout` también agrega latencia artificial innecesaria.

---

### BUG-006 · Ícono vacío invisible en estado de carrito vacío

**Archivo:** `apps/mobile/app/(tabs)/cart.tsx:63,126`  
**Severidad:** 🟠 Alto  

```ts
// ❌ Actual — color igual al fondo, ícono invisible
emptyIcon: { fontSize: 48, color: colors.bg.surface },

// ✅ Fix
emptyIcon: { fontSize: 48, color: colors.text.muted },
// O reemplazar con: <Ionicons name="cart-outline" size={48} color={colors.text.muted} />
```

El glifo `◈` del estado vacío tiene `color: colors.bg.surface` — exactamente el mismo color que el fondo de la pantalla. El ícono desaparece completamente.

---

## 3. Bugs Medios

### BUG-007 · Confirmación faltante al vaciar carrito

**Archivo:** `apps/mobile/app/(tabs)/cart.tsx:94`  
**Severidad:** 🟡 Medio  

```tsx
// ❌ Actual — destructivo sin confirmación
<Pressable onPress={clearCart}>
  <Text>Vaciar carrito</Text>
</Pressable>

// ✅ Fix
<Pressable onPress={() =>
  Alert.alert(
    '¿Vaciar carrito?',
    'Se eliminarán todos los productos.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Vaciar', style: 'destructive', onPress: clearCart },
    ]
  )
}>
```

Un tap accidental destruye toda la orden en curso sin posibilidad de recuperarla.

---

### BUG-008 · Búsqueda desactiva infinite scroll aunque haya más datos

**Archivo:** `apps/mobile/app/(tabs)/orders.tsx:140`  
**Severidad:** 🟡 Medio  

```ts
// ❌ Actual — cualquier texto de búsqueda bloquea la paginación
if (!hasMore || loadingMore || search) return;
```

Si el usuario busca una orden que está en páginas antiguas no cargadas, nunca la encontrará porque el scroll paginado se desactiva con cualquier texto de búsqueda.

---

### BUG-009 · Retry de analytics recarga toda la aplicación

**Archivo:** `apps/web/src/pages/AnalyticsPage.tsx:147`  
**Severidad:** 🟡 Medio  

```ts
// ❌ Actual
onClick={() => window.location.reload()}

// ✅ Fix — reintentar solo el fetch
const fetchData = useCallback(() => { /* extraer el fetch a función */ }, [tenantId]);
onClick={() => fetchData()}
```

---

### BUG-010 · Estado `subscriptionWarning` declarado después de su uso

**Archivo:** `apps/mobile/src/providers/AppProvider.tsx:206-212`  
**Severidad:** 🟡 Bajo-Medio  

```ts
// ❌ Actual — authValue usa subscriptionWarning antes de declararlo
const authValue: AuthContextValue = {
  subscriptionWarning,  // ← usada aquí (línea ~208)
};
const [subscriptionWarning, setSubscriptionWarning] = useState(null);  // ← declarada aquí (línea ~206)

// ✅ Fix — mover el useState antes de authValue
```

Funciona en JS pero genera confusión y puede causar problemas con herramientas de análisis estático.

---

## 4. Deuda Técnica

### DEBT-001 · `(db as any)` silencia incompatibilidad de tipos

**Archivo:** `apps/mobile/src/hooks/useCheckout.ts:47-49`  

```ts
// Tres instancias del mismo problema
new SqliteOrderRepository(db as any),
new SqliteItemRepository(db as any),
new SqliteTenantRepository(db as any),
```

El tipo de `db` de `usePowerSync()` no es compatible con el que esperan los repositorios. El cast silencia el error. Resolver con un type adapter o ajustando las interfaces de los repositorios.

---

### DEBT-002 · `FlashList as any` en pantallas críticas

**Archivos:** `apps/mobile/app/(tabs)/index.tsx:13`, `apps/mobile/app/(tabs)/orders.tsx:14`  

```ts
const AnyFlashList = FlashList as any;
```

Revisar si hay una versión actualizada de `@shopify/flash-list` con tipos correctos o crear un wrapper tipado.

---

### DEBT-003 · `children: any` en providers

**Archivo:** `apps/mobile/src/providers/AppProvider.tsx:102,156`  

```ts
// ❌ Actual
children: any

// ✅ Fix
import type { ReactNode } from 'react';
children: ReactNode
```

---

## 5. Issues de UI/UX

### UX-001 · Íconos de tabs son glifos Unicode

**Archivo:** `apps/mobile/app/(tabs)/_layout.tsx:7`  
**Severidad:** 🔴 Alta  

```tsx
// ❌ Actual — glifos Unicode inconsistentes entre plataformas
tabBarIcon: ({ color }) => <TabIcon symbol="⊞" color={color} />
tabBarIcon: ({ color }) => <TabIcon symbol="◈" color={color} badge={itemCount} />
tabBarIcon: ({ color }) => <TabIcon symbol="◉" color={color} />

// ✅ Fix — usar Ionicons (ya importado en otras pantallas)
import { Ionicons } from '@expo/vector-icons';
tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} />
tabBarIcon: ({ color }) => <Ionicons name="cart-outline" size={22} color={color} />
tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={22} color={color} />
```

Los glifos Unicode son dependientes del sistema operativo, no tienen `accessibilityLabel` para lectores de pantalla, y no pueden controlarse con design tokens.

---

### UX-002 · Tab bar sin safe area insets (iOS)

**Archivo:** `apps/mobile/app/(tabs)/_layout.tsx:30-36`  
**Severidad:** 🔴 Alta  

```tsx
// ❌ Actual — altura fija, content oculto bajo el home indicator en iPhone
tabBarStyle: { height: 60, paddingBottom: 8 }

// ✅ Fix
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();
// tabBarStyle: { height: 60 + insets.bottom, paddingBottom: 8 + insets.bottom }
```

En iPhone con Dynamic Island o indicador home, el contenido de la tab bar queda oculto bajo el sistema.

---

### UX-003 · Touch targets de tabs por debajo del mínimo (44×44pt)

**Archivo:** `apps/mobile/app/(tabs)/_layout.tsx:75`  
**Severidad:** 🔴 Alta  

```ts
// ❌ Actual — 32×28px, bajo el mínimo de Apple HIG (44×44pt)
iconContainer: { width: 32, height: 28 }

// ✅ Fix
iconContainer: { width: 44, height: 44 }
```

---

### UX-004 · Skeleton sin animación shimmer

**Archivo:** `apps/mobile/app/(tabs)/index.tsx:42-52`  
**Severidad:** 🟠 Alta  

Los rectángulos grises estáticos no comunican que hay carga activa. Implementar shimmer animado con `react-native-reanimated`:

```tsx
// Usar Animated.loop + interpolation de opacidad 0.4→1→0.4
// O librería: react-native-skeleton-placeholder
```

---

### UX-005 · Search bars a 40px de alto (bajo mínimo 44pt)

**Archivos:** `apps/mobile/app/(tabs)/index.tsx:256`, `apps/mobile/app/(tabs)/orders.tsx:272`  
**Severidad:** 🟡 Media  

```ts
// ❌ Actual
searchBar: { height: 40 }

// ✅ Fix
searchBar: { height: 44 }
```

---

### UX-006 · Retry button en error state sin feedback de press

**Archivo:** `apps/mobile/app/(tabs)/index.tsx:225`  
**Severidad:** 🟡 Media  

```tsx
// ❌ Actual
<Pressable style={st.retryBtn}>

// ✅ Fix
<Pressable
  style={({ pressed }) => [st.retryBtn, pressed && { opacity: 0.7 }]}
  onPress={handleRetry}
>
```

---

### UX-007 · `todayLabel` y `badgeText` con fontSize < 12px

**Archivos:** `orders.tsx:268`, `_layout.tsx:83`  
**Severidad:** 🟡 Media  

```ts
todayLabel: { fontSize: 10 }  // ← bajo mínimo legible
badgeText:  { fontSize: 9  }  // ← extremadamente pequeño
```

Mínimo recomendado: 12px para texto secundario.

---

### UX-008 · Emoji en títulos de AnalyticsPage (web)

**Archivo:** `apps/web/src/pages/AnalyticsPage.tsx`  
**Severidad:** 🟡 Media  

```tsx
// ❌ Usar emojis como íconos estructurales
<h1>📊 Analytics Real-time</h1>
<ChartContainer title="💹 Tendencia de Ventas">
<ChartContainer title="🏆 Items más Vendidos">

// ✅ Fix — usar íconos SVG de Lucide o similar
```

---

### UX-009 · AnalyticsPage (web) con inline styles en lugar de CSS/Tailwind

**Archivo:** `apps/web/src/pages/AnalyticsPage.tsx`  
**Severidad:** 🟡 Media  

El 95% de los estilos son objetos inline. Migrar a Tailwind CSS (consistente con el resto del web app) para mantenibilidad y eliminación de duplicación.

---

### UX-010 · Password toggle con posición absoluta hardcodeada

**Archivo:** `apps/mobile/app/(auth)/login.tsx:181`  
**Severidad:** 🟢 Baja  

```tsx
// ❌ Frágil — depende de la altura exacta del label del Input component
style={{ position: 'absolute', right: 12, top: 38 }}

// ✅ Fix — usar un flex wrapper con alignItems: 'center'
```

---

## 6. Sugerencias de Features

### FEAT-001 · Escaneo de código de barras 🔥

**Prioridad:** Alta | **Esfuerzo:** Medio  

Un POS sin scanner manual tiene UX muy limitada para negocios con catálogos grandes.

```
Implementar con: expo-camera + expo-barcode-scanner
Flujo: botón en catálogo → activa cámara → escanea → busca item → agrega al carrito
```

---

### FEAT-002 · Recibo compartible (PDF / imagen)

**Prioridad:** Alta | **Esfuerzo:** Medio  
**Archivo actual:** `apps/mobile/app/order-detail.tsx` (tiene placeholder "Print Receipt")

```
Implementar con: react-native-view-shot + Share Sheet
Formatos: imagen PNG del recibo o PDF básico
Canales: WhatsApp, email, imprimir
```

---

### FEAT-003 · Input de cantidad directa en carrito

**Prioridad:** Alta | **Esfuerzo:** Bajo  

Los botones ±1 son ineficientes para cantidades grandes (ej: 50 unidades de un producto).

```tsx
// Tap en el número de cantidad → TextInput numérico editable
// Con validación: entero positivo, no mayor que stock disponible
```

---

### FEAT-004 · Nombre de cliente en orden

**Prioridad:** Alta | **Esfuerzo:** Bajo  

Campo opcional en el checkout para registrar `customer_name`. Útil para historiales, llamar al cliente, y búsqueda en órdenes.

---

### FEAT-005 · Banner offline prominente

**Prioridad:** Alta | **Esfuerzo:** Bajo  

El `SyncBadge` en el header del catálogo es muy sutil. Cuando el usuario está offline, debe haber una barra visible en todas las pantallas.

```tsx
// En _layout.tsx del Stack, mostrar un banner global si status === 'disconnected'
// "Sin conexión — trabajando en modo local"
```

---

### FEAT-006 · Descuentos por orden

**Prioridad:** Media | **Esfuerzo:** Medio  

Campo en el carrito para aplicar un descuento (porcentaje o monto fijo) antes de cobrar. Fundamental para cualquier POS real.

---

### FEAT-007 · Flujo de devolución / reembolso

**Prioridad:** Media | **Esfuerzo:** Medio  

El schema y el `STATUS_CONFIG` ya soportan `refunded` y `partially_refunded`, pero no hay UI para iniciarlo desde `order-detail`.

---

### FEAT-008 · Cierre de caja diario

**Prioridad:** Media | **Esfuerzo:** Medio  

Resumen al final del día: total de ventas, cantidad de órdenes, desglose por tipo (producto/servicio). Exportable como PDF o imagen para compartir con el dueño del negocio.

---

### FEAT-009 · Export CSV en Analytics (web)

**Prioridad:** Media | **Esfuerzo:** Bajo  

El dashboard de analytics no tiene export de datos. Agregar botón "Exportar CSV" que genere el archivo de `daily_sales` y `top_items`.

---

### FEAT-010 · Gestión de mesas (restaurante)

**Prioridad:** Media | **Esfuerzo:** Alto  

El schema ya tiene `tables_restaurant`. Agregar una pantalla de mapa de mesas como tab opcional, activable por tipo de negocio.

---

### FEAT-011 · Notificaciones push (web → móvil)

**Prioridad:** Baja | **Esfuerzo:** Alto  

Alertas cuando baja el stock de un producto por debajo del umbral mínimo. Implementar con Supabase Realtime + Expo Notifications.

---

### FEAT-012 · Múltiples métodos de pago

**Prioridad:** Baja | **Esfuerzo:** Alto  

Actualmente todas las órdenes son un único método implícito. Para negocios reales: efectivo, tarjeta, transferencia, con posibilidad de split de pago.

---

## 7. Checklist de Acción

### Sprint inmediato (antes de launch)

- [ ] **BUG-001** — Reemplazar `user_id: 'demo-user-id'` con ID del usuario autenticado
- [ ] **BUG-002** — Agregar `LoadingScreen` mientras DB inicializa + manejar error de init
- [ ] **BUG-003** — Eliminar `console.log` con datos de tenant y analytics
- [ ] **BUG-004** — Corregir validación JWT con URL parsing exacto
- [ ] **UX-001** — Reemplazar glifos Unicode de tabs con Ionicons
- [ ] **UX-002** — Agregar safe area insets a la tab bar
- [ ] **UX-003** — Aumentar touch targets de íconos a 44×44

### Sprint siguiente

- [ ] **BUG-005** — Corregir `handleEndReached` para esperar async `loadMore`
- [ ] **BUG-006** — Corregir color del ícono vacío en carrito
- [ ] **BUG-007** — Agregar confirmación al vaciar carrito
- [ ] **BUG-009** — Retry de analytics sin `window.location.reload()`
- [ ] **UX-004** — Implementar skeleton shimmer animado
- [ ] **UX-005** — Aumentar search bars a 44px de alto
- [ ] **DEBT-001** — Resolver incompatibilidad de tipos con `(db as any)`
- [ ] **FEAT-003** — Input de cantidad directa en carrito
- [ ] **FEAT-004** — Campo de nombre de cliente en checkout
- [ ] **FEAT-005** — Banner offline global

### Backlog

- [ ] **FEAT-001** — Escaneo de código de barras
- [ ] **FEAT-002** — Recibo compartible (PDF/imagen)
- [ ] **FEAT-006** — Sistema de descuentos
- [ ] **FEAT-007** — Flujo de devolución/reembolso
- [ ] **FEAT-008** — Cierre de caja diario
- [ ] **FEAT-009** — Export CSV en Analytics
- [ ] **DEBT-002** — Resolver `FlashList as any`
- [ ] **DEBT-003** — Tipar `children` como `ReactNode`

---

*Generado por Claude Code · claude-sonnet-4-6 · 2026-04-27*
