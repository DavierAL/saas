# ADR 0002: Implementación de Registro de Usuarios y Flujo de Onboarding

## Estado
Propuesto

## Contexto
Para el MVP de la plataforma SaaS POS, necesitamos permitir que nuevos usuarios se registren de manera autónoma. La implementación original tenía campos adicionales como `fullName` e `invitationCode`, pero para simplificar el onboarding inicial y alinearse con la visión del producto actual, se ha decidido utilizar un flujo más directo.

## Decisiones

### 1. Formulario de Registro Simplificado
Se han reducido los campos de registro a:
- **Email**: Identificador único.
- **Password**: Mínimo 8 caracteres.
- **Confirm Password**: Validación local para evitar errores tipográficos.

### 2. Validación en el Cliente
Se implementó una función `validate()` tanto en Mobile como en Web que verifica:
- Formato de email.
- Longitud mínima de contraseña.
- Coincidencia de contraseñas.
Esto reduce latencia y llamadas innecesarias a la API de Supabase.

### 3. Manejo de Errores Específicos
Se captura específicamente el error `already registered` de Supabase Auth para mostrar un mensaje amigable en español: *"Ya existe una cuenta con ese correo."*.

### 4. Redirección a Onboarding (Mobile)
Tras un registro exitoso, el usuario es redirigido a una nueva ruta `/(auth)/onboarding`. Esta pantalla sirve como "bridge" para configurar el tenant o negocio en el futuro (Tarea 3).

### 5. Registro en Web
Se habilitó la ruta `/register` en la aplicación web para mantener paridad de funcionalidades. El diseño sigue el sistema visual premium establecido para el login.

## Consecuencias

### Positivas
- Reducción de fricción en el registro.
- Mejor experiencia de usuario con mensajes de error claros.
- Estructura preparada para el flujo de configuración de negocio (Onboarding).

### Negativas / Riesgos
- Al eliminar `invitationCode`, el sistema de invitación actual (si existía) queda desactivado temporalmente hasta que se defina el flujo de Onboarding completo.
- Se requiere que el administrador desactive manualmente "Confirm email" en Supabase Dashboard para evitar que los usuarios queden bloqueados tras el registro en esta etapa de pruebas.
