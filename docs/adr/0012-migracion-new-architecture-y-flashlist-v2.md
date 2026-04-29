# ADR 0012: Migración a React Native New Architecture y FlashList v2

## Estatus
Aceptado

## Contexto
La aplicación móvil se encontraba en una situación de "punto muerto" técnico tras la actualización a React Native 0.81.5:
1.  **Arquitectura Legacy**: El proyecto estaba configurado con `newArchEnabled: false`.
2.  **Incompatibilidad de FlashList**: 
    - Las versiones v2.x de `@shopify/flash-list` requieren la New Architecture o causan cierres inesperados (crashes) en modo Legacy.
    - Los intentos de retroceder a la versión v1.7.1 (compatible con Legacy) fallaron debido a incompatibilidades con el motor de Kotlin y la estructura de RN 0.81.
3.  **Error de Compilación**: Se presentaba de forma persistente el error `Execution failed for task ':shopify_flash-list:compileDebugKotlin'`, derivado de la falta de soporte para arquitecturas antiguas en las dependencias modernas.

## Decisión
Se ha decidido migrar formalmente la aplicación móvil a la **New Architecture** (Fabric/TurboModules) y estandarizar el uso de versiones modernas de las dependencias nativas.

### Acciones Realizadas:
1.  **Habilitación de New Architecture**: 
    - Se modificó `apps/mobile/app.json` estableciendo `"newArchEnabled": true`.
    - Se sincronizó `apps/mobile/android/gradle.properties` con `newArchEnabled=true`.
2.  **Actualización de FlashList**:
    - Se instaló `@shopify/flash-list@2.3.1`. Esta versión utiliza una implementación puramente JavaScript en Android, lo que elimina los conflictos de compilación de Kotlin y mejora la estabilidad en versiones experimentales de React Native.
3.  **Sincronización Nativa**:
    - Se ejecutó `npx expo prebuild` para regenerar la estructura del proyecto Android y aplicar los cambios de arquitectura de forma limpia.

## Consecuencias

### Positivas:
- **Estabilidad de Compilación**: Se resolvió el error crítico de Kotlin que bloqueaba el desarrollo.
- **Alineación Tecnológica**: El proyecto ahora utiliza los estándares modernos de React Native (0.81+), lo que facilita la integración de librerías futuras.
- **Rendimiento**: FlashList v2 aprovecha mejor las optimizaciones de la New Architecture.

### Riesgos / Mitigación:
- **Compatibilidad de Terceros**: Otras librerías nativas podrían no ser 100% compatibles con la New Architecture. Se requiere una auditoría continua de dependencias.
- **Tiempos de Build**: La primera compilación con New Architecture puede ser más lenta debido a la compilación de componentes C++ nativos.

## Referencias
- [React Native New Architecture Guide](https://reactnative.dev/docs/the-new-architecture-intro)
- [Shopify FlashList v2 Migration](https://shopify.github.io/flash-list/docs/migration-v2)
