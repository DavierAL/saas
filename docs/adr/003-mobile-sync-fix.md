# ADR 003: Corrección de Sincronización Local-First (PowerSync + Supabase)

## Estatus
Aceptado

## Contexto
La aplicación móvil presentaba un estado vacío ("empty state") persistente a pesar de que el usuario estaba autenticado y existían datos en Supabase. El diagnóstico reveló tres fallos en cascada:
1. El JWT no contenía el `tenant_id` en el nivel esperado por la aplicación.
2. Las reglas de sincronización de PowerSync Cloud fallaban al no encontrar el `tenant_id` en el JWT.
3. El driver nativo de SQLite para PowerSync no estaba instalado en el paquete móvil.

## Decisión
Se implementaron las siguientes soluciones técnicas:

1. **Robustez de JWT:** Se modificó `extractClaim` en `AppProvider.tsx` para buscar claims en `root`, `app_metadata` y `user_metadata`. Esto desacopla la aplicación de la activación inmediata del Hook de Supabase Auth.
2. **Sincronización Resiliente:** Se actualizaron las reglas en `powersync.yaml` usando `COALESCE` para permitir que PowerSync Cloud identifique el tenant desde cualquier parte del JWT.
3. **Persistencia Nativa:** Se instaló `@journeyapps/react-native-quick-sqlite` para cumplir con el requisito de "velocidad nativa JSI" de las reglas del proyecto.

## Consecuencias
- **Positivas:** La aplicación es ahora más tolerante a configuraciones parciales de Supabase Auth. El rendimiento de la base de datos local será superior al usar el driver JSI.
- **Negativas:** Se requiere una reconstrucción del binario (`npx expo run:android`) debido a la adición de una dependencia nativa.

## Notas Técnicas
- El Hook de Supabase Auth sigue siendo recomendado para limpieza del JWT, pero ya no es un punto único de fallo.
- Se añadieron logs de diagnóstico (`[JWT]`, `[DatabaseProvider]`) para facilitar el soporte futuro.
