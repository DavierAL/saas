# ADR 0005: Reconciliación de Usuario de Prueba "Don Pepe"

## Estado
Aceptado

## Contexto
El usuario reportó un error de "Usuario o contraseña incorrectos" al intentar ingresar con las credenciales de prueba (`donpepe@saas.com` / `password123`). 

La investigación reveló que:
1. La inserción manual vía SQL en `auth.users` utilizó una versión de hash (`bf` con rondas por defecto) que no era compatible con los requerimientos de GoTrue (Supabase Auth), que típicamente espera `$2a$10$...`.
2. Al intentar corregir registrando el usuario vía navegador, se crearon IDs duplicados y conflictos de llaves foráneas con las órdenes ya simuladas.
3. El `raw_user_meta_data` en `auth.users` no contenía el `tenant_id`, lo que impediría el acceso correcto al dashboard multi-tenant.

## Decisión
Se realizó una reconciliación completa mediante SQL directo a nivel de base de datos para:
1. **Resetear el Password**: Se generó un nuevo hash compatible con Supabase (`crypt('password123', gen_salt('bf', 10))`).
2. **Inyectar Metadata**: Se agregó el `tenant_id` (`d86874dd-0418-4cf6-929c-0afe3cee82f9`) directamente en el campo `raw_user_meta_data` de la tabla `auth.users` para que el JWT contenga la información necesaria para el hook `useTenantId`.
3. **Migración de Datos**: Se transfirieron las 180 órdenes y registros relacionados del usuario "huérfano" al nuevo usuario funcional.
4. **Sincronización de Tablas**: Se aseguró la existencia del registro correspondiente en `public.users`.

## Consecuencias
- El usuario `donpepe@saas.com` con password `password123` ahora es funcional.
- Al iniciar sesión, el sistema detectará automáticamente que pertenece a "Bodega Don Pepe" y mostrará las estadísticas simuladas (S/ 4,500+ mensuales).
- Se eliminaron los usuarios temporales/fallidos para mantener la integridad de la base de datos.

## Procedimiento de Verificación
1. **SQL Check**: Confirmado que `auth.users` tiene el email y metadata correctos.
2. **Link Check**: Confirmado que las órdenes están vinculadas al ID de auth actual (`6ee0179d-ad6b-4353-a518-6f6bf960bfcc`).
3. **Auth Check**: El hash ahora usa 10 rondas de BCrypt, compatible con el motor de Supabase.
