# ADR 0007: Implementación de Resumen Detallado de Órdenes

## Estado
Aceptado

## Contexto
El usuario requiere una forma de ver los detalles de cada orden (productos, cantidades, precios) desde la vista de Órdenes en la aplicación web. Anteriormente, la vista solo mostraba un resumen general (ID, fecha, total).

## Decisiones
1. **Modal de Detalle**: Se implementó un modal (overlay) que se activa al hacer clic en cualquier fila de la tabla de órdenes. Esto permite ver el detalle sin perder el contexto de la lista principal.
2. **Carga Asíncrona de Líneas**: Las líneas de la orden se cargan bajo demanda cuando se abre el modal. Esto optimiza el rendimiento inicial de la página al no cargar miles de líneas de productos innecesariamente.
3. **Join en Repositorio**: Se actualizó `SupabaseOrderRepository` para realizar un JOIN con la tabla `items` mediante `.select('*, items(name)')`, permitiendo mostrar el nombre del producto en lugar de solo su ID.
4. **Diseño Premium**: Se aplicaron estilos con glassmorphism (`backdrop-filter: blur`), tipografía monoespaciada para IDs y variables de CSS para mantener la consistencia con el tema oscuro de la aplicación.

## Consecuencias
- **Positivas**: Mejor experiencia de usuario (UX), mayor visibilidad de los datos de venta, cumplimiento de las reglas de diseño dinámico.
- **Neutrales**: Requiere una llamada adicional a la API por cada apertura de modal.
- **Riesgos**: Ninguno identificado en esta etapa.

## Verificación
- Verificado mediante browser subagent: la tabla carga correctamente y el modal muestra los datos reales de la base de datos (Don Pepe).
