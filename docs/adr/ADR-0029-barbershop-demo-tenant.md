# ADR-0029: Creación de Tenant de Barbería para Demo a Cliente

## Contexto

Se requiere realizar una demostración del proyecto SaaS a un cliente potencial que administra una barbería. Para que la demostración sea efectiva y realista, es necesario contar con un tenant configurado específicamente para el rubro de barberías, con sus respectivos usuarios y configuración de módulos.

## Decisión

Se ha decidido crear manualmente en la base de datos (Supabase) un tenant dedicado para esta demostración.

### Detalles del Tenant Creado

- **ID del Tenant:** `c001c001-0000-0000-0000-000000000001`
- **Nombre:** Barbería Demo (Barbería El Mago)
- **Tipo de Industria:** `barbershop`
- **Configuración de Módulos (`modules_config`):**
  - `has_tables`: `false` (Las barberías no usan mesas de restaurante)
  - `has_inventory`: `true` (Para venta de productos como ceras, lociones, etc.)
  - `has_appointments`: `true` (Módulo principal para gestión de citas y turnos)

### Credenciales de Acceso (Usuario Administrador)

Se ha creado un usuario administrador vinculado a este tenant en el sistema de autenticación de Supabase (`auth.users`), en la tabla pública `users` y en `tenant_members`.

- **Email:** `demo@barberia.com`
- **Contraseña:** `password123`
- **Rol:** `admin`

## Consecuencias y Uso para la Demo

1. **Acceso:** Durante la reunión con el cliente, se debe iniciar sesión utilizando las credenciales `demo@barberia.com` / `password123`.
2. **Módulos Visibles:** Al ingresar, el sistema detectará automáticamente que el `industry_type` es `barbershop` y cargará el módulo de citas (`has_appointments: true`). El módulo de mesas de restaurante no estará visible.
3. **Datos de Prueba:** Actualmente el tenant está en blanco. Se recomienda crear 2 o 3 citas de prueba y añadir un par de productos al inventario antes de la reunión para mostrar la plataforma con datos reales.
4. **Aislamiento:** Al ser un tenant separado, ninguna de las pruebas o datos ingresados afectará a los tenants existentes (como los de Don Pepe o La Esquina).

## Pasos Siguientes

- Ingresar al sistema localmente con las credenciales creadas.
- Navegar al módulo de Citas y revisar el historial de los últimos 20 días.
- Revisar el módulo de Inventario/Servicios para ver los cortes configurados.
- Presentar la demo al cliente.

### Servicios de Barbería Creados

| Servicio | Precio | Categoría |
|---|---|---|
| Corte de Cabello | 25.00 | Servicios |
| Degradado | 30.00 | Servicios |
| Escolar | 20.00 | Servicios |
| Clásico | 25.00 | Servicios |
| Con Barba | 40.00 | Servicios |

### Staff de Barbería (Barbero)

Se ha creado un usuario Barbero para mostrar la funcionalidad de múltiples empleados y comisiones.

- **Email:** `barbero@barberia.com`
- **Contraseña:** `barberpassword`
- **Comisión:** 40% (Configurado en `raw_user_meta_data.commission_rate`)
- **Nombre:** Juan Barbero

### Historial de Demo

Se han generado aproximadamente **90 registros históricos** que abarcan los últimos **21 días**:
- **Citas:** En estado `done`.
- **Ventas:** En estado `paid` con sus respectivos detalles de venta vinculados a los servicios realizados.
- **Distribución:** Entre 3 y 6 servicios diarios, distribuidos aleatoriamente entre los servicios creados.

---

## ⚠️ Post-Mortem: Errores al Crear Usuarios Manualmente con SQL

### Problema

Al crear el usuario `demo@barberia.com` directamente en la base de datos con sentencias SQL (`INSERT INTO auth.users ...`), el login falló repetidamente con el error genérico "Correo o contraseña incorrectos", aunque la contraseña era correcta.

### Causa Raíz

Supabase Auth no utiliza `DEFAULT` automático en varios campos de la tabla `auth.users` cuando se insertan filas directamente. El motor GoTrue (el servicio de auth de Supabase) espera que esos campos **nunca sean `NULL`**, y al intentar deserializarlos en structs de Go, lanza un panic interno que devuelve un `HTTP 500`.

Se identificaron **tres fases de error** en cascada, resueltas en este orden:

| # | Error en logs de Auth | Campo afectado | Tabla |
|---|---|---|---|
| 1 | `Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported` | `confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change` | `auth.users` |
| 2 | `400: Email not confirmed` | `email_confirmed_at` era `NULL` | `auth.users` |
| 3 | `Scan error on column index 5, name "created_at": unsupported Scan, storing driver.Value type <nil> into type *time.Time` | **`created_at`, `updated_at`** | `auth.users` |
| 4 | (implícito) | `identity_data` sin `email_verified`, `last_sign_in_at` NULL | `auth.identities` |

El error más crítico y menos obvio fue el **3**: `created_at` y `updated_at` en `auth.users` no tienen `DEFAULT now()` en el schema de Supabase Cloud, por lo que quedaron en `NULL` al hacer el `INSERT` manual.

### Solución Aplicada

Se ejecutaron los siguientes `UPDATE` correctivos sobre el usuario ya creado:

```sql
-- 1. Tokens de string que no pueden ser NULL
UPDATE auth.users 
SET confirmation_token = '', recovery_token = '', 
    email_change_token_new = '', email_change = ''
WHERE email = 'demo@barberia.com';

-- 2. Timestamps obligatorios
UPDATE auth.users 
SET created_at = now(), updated_at = now()
WHERE email = 'demo@barberia.com';

-- 3. Contraseña con el nivel de bcrypt correcto (10 rondas)
UPDATE auth.users 
SET encrypted_password = crypt('password123', gen_salt('bf', 10))
WHERE email = 'demo@barberia.com';
```

```sql
-- 4. Identity con todos los campos requeridos
UPDATE auth.identities 
SET identity_data = '{
  "sub": "<USER_UUID>",
  "email": "demo@barberia.com",
  "email_verified": true,
  "phone_verified": false
}',
last_sign_in_at = now()
WHERE user_id = '<USER_UUID>';
```

### ✅ Plantilla SQL Correcta para Futuros Usuarios de Demo

Para evitar que este problema se repita, **siempre usar la siguiente plantilla completa** al insertar usuarios manualmente:

```sql
-- PASO 1: Insertar en auth.users con TODOS los campos obligatorios
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  email_change_confirm_status,
  phone,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user,
  created_at,   -- ← CRÍTICO: siempre rellenar
  updated_at    -- ← CRÍTICO: siempre rellenar
) VALUES (
  gen_random_uuid(),                             -- id
  '00000000-0000-0000-0000-000000000000',        -- instance_id
  'authenticated',                               -- aud
  'authenticated',                               -- role
  'nuevo@demo.com',                              -- email
  crypt('contraseña_segura', gen_salt('bf', 10)), -- encrypted_password (10 rondas)
  now(),                                         -- email_confirmed_at
  '',                                            -- confirmation_token (string vacío, NO null)
  '',                                            -- recovery_token
  '',                                            -- email_change_token_new
  '',                                            -- email_change
  '',                                            -- email_change_token_current
  0,                                             -- email_change_confirm_status
  '',                                            -- phone (string vacío, NO null para algunos campos)
  '',                                            -- phone_change
  '',                                            -- phone_change_token
  '',                                            -- reauthentication_token
  '{"provider":"email","providers":["email"],"tenant_id":"<TENANT_UUID>"}', -- raw_app_meta_data
  '{"role":"admin","tenant_id":"<TENANT_UUID>","email_verified":true}',     -- raw_user_meta_data
  false,                                         -- is_super_admin
  false,                                         -- is_sso_user
  now(),                                         -- created_at ← CRÍTICO
  now()                                          -- updated_at ← CRÍTICO
) RETURNING id;

-- PASO 2: Insertar en auth.identities con el UUID devuelto por el paso anterior
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES (
  '<UUID_DEL_PASO_1>',
  '<UUID_DEL_PASO_1>',
  '<UUID_DEL_PASO_1>',
  'email',
  '{"sub":"<UUID_DEL_PASO_1>","email":"nuevo@demo.com","email_verified":true,"phone_verified":false}',
  now(),
  now(),
  now()
);
```

> **Regla de oro:** Si el método de Supabase Admin UI ("Authentication → Users → Invite/Create") está disponible, **siempre preferirlo** sobre el INSERT manual. Solo usar SQL directo cuando sea estrictamente necesario y siguiendo esta plantilla completa.

## Pasos Siguientes (Futuros Clientes)

Para crear demos de nuevos clientes, copiar y adaptar el script SQL de la plantilla anterior. Los campos que varían por tenant son:
- `email`
- `encrypted_password` (contraseña en texto plano que `crypt()` encriptará)
- `tenant_id` en `raw_app_meta_data` y `raw_user_meta_data`
- El INSERT correspondiente en `public.tenants`, `public.users` y `public.tenant_members`
