# ADR 0013: Estabilización de Inicialización y Refinamiento de UX en POS Móvil

## Estado
Aceptado

## Contexto
La aplicación POS móvil presentaba inestabilidades visuales durante el arranque (flasheos en blanco) causados por la inicialización asíncrona de PowerSync. Además, la experiencia de usuario carecía de retroalimentación visual durante la carga de datos (skeletons) y de funcionalidades críticas de negocio, como la atribución de nombres de clientes a las órdenes y el ajuste manual preciso de cantidades en el carrito.

## Decisión

### 1. Control de Ciclo de Vida de Base de Datos
Se implementó un estado `isDbReady` en el `AppProvider` coordinado con un componente `LoadingScreen`. La aplicación ahora bloquea el renderizado del árbol de navegación hasta que la conexión con SQLite local esté confirmada y los esquemas validados.

### 2. Retroalimentación Visual (Skeletons)
Se adoptó un sistema de "Skeleton Screens" para el catálogo y la lista de órdenes. Se creó un componente base `Skeleton.tsx` que utiliza `react-native-reanimated` para una animación de "shimmer" de 60fps, mejorando la percepción de rendimiento durante las consultas reactivas a PowerSync.

### 3. Extensión del Dominio: Atribución de Clientes
Se decidió extender la entidad `Order` en la capa de dominio y el esquema de persistencia para incluir `customer_name`. 
- **Persistencia**: Se agregó una migración (v2) al `migration-runner.ts` de SQLite y se actualizó el `AppSchema` de PowerSync.
- **Flujo**: El caso de uso `checkout` ahora acepta opcionalmente este metadato, permitiendo una mejor trazabilidad de ventas en el dashboard administrativo.

### 4. Interacciones del Carrito
Para optimizar el espacio en pantallas pequeñas, se decidió no utilizar selectores de cantidad complejos. En su lugar:
- **Incremento/Decremento**: Botones rápidos para cambios menores.
- **Edición Manual**: Uso de `Alert.prompt` con teclado numérico invocado mediante `onLongPress`. Esto reduce la carga cognitiva y evita errores de dedo en órdenes con muchas unidades.

## Consecuencias
- **Positivas**: Eliminación de estados de carrera (race conditions) durante el inicio. Mejora significativa en el "look & feel" profesional. Capacidad de capturar datos de cliente sin añadir complejidad a la interfaz principal.
- **Negativas**: Mayor acoplamiento entre el `AppProvider` y el estado de la base de datos. Ligero incremento en el bundle size por la inclusión de `react-native-reanimated`.
