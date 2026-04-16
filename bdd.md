# Arquitectura y Normalización de Base de Datos: SaaS Multi-Tenant

## 1. Modelado Lógico (Los Módulos Core)

Para que el sistema sea modular y sirva para restaurantes, barberías y abarrotes, la base de datos se divide en los siguientes dominios:

- **Dominio de Inquilinos (Tenants):** Los negocios que pagan la suscripción.
- **Dominio de Identidad:** Los empleados o usuarios que usan la aplicación.
- **Dominio de Catálogo:** Lo que se vende (pueden ser productos físicos o servicios).
- **Dominio Transaccional:** Órdenes, ventas y líneas de detalle.
- **Dominios Específicos (Modulares):** Mesas (para restaurantes), Citas (para barberías).

---

## 2. Diseño Físico y Normalización (1NF, 2NF, 3NF)

A continuación, se detalla el esquema físico de las tablas respetando la **Tercera Forma Normal (3NF)**.

### A. Tabla `tenants` (Los negocios)

Almacena la información de tus clientes (el restaurante, la barbería, etc.).

| Columna          | Tipo de Dato | Restricciones / Descripción                                                         |
| :--------------- | :----------- | :---------------------------------------------------------------------------------- |
| `id`             | `UUID`       | **Primary Key**                                                                     |
| `name`           | `VARCHAR`    | Nombre del negocio.                                                                 |
| `industry_type`  | `VARCHAR`    | Ej: `'restaurant'`, `'barbershop'`, `'retail'`.                                     |
| `modules_config` | `JSONB`      | **¡Clave para la modularidad!** Ej: `{"has_inventory": true, "has_tables": false}`. |
| `created_at`     | `TIMESTAMP`  | Fecha de creación.                                                                  |
| `updated_at`     | `TIMESTAMP`  | Fecha de actualización.                                                             |
| `deleted_at`     | `TIMESTAMP`  | Borrado lógico (Soft delete).                                                       |

### B. Tabla `users` (Los empleados del negocio)

Gestiona la identidad de las personas que operan el sistema.

| Columna         | Tipo de Dato | Restricciones / Descripción                            |
| :-------------- | :----------- | :----------------------------------------------------- |
| `id`            | `UUID`       | **Primary Key**                                        |
| `tenant_id`     | `UUID`       | **Foreign Key**. Relaciona al empleado con el negocio. |
| `email`         | `VARCHAR`    | **Unique**.                                            |
| `password_hash` | `VARCHAR`    | Contraseña encriptada.                                 |
| `role`          | `VARCHAR`    | Ej: `'admin'`, `'cashier'`, `'waiter'`.                |
| `created_at`    | `TIMESTAMP`  | Fecha de creación.                                     |
| `updated_at`    | `TIMESTAMP`  | Fecha de actualización.                                |
| `deleted_at`    | `TIMESTAMP`  | Borrado lógico (Soft delete).                          |

### C. Tabla `items` (Productos y Servicios)

_Aplicación de normalización:_ Entidad unificada para productos (cajas de leche) y servicios (cortes de cabello) ya que ambos se facturan igual.

| Columna      | Tipo de Dato    | Restricciones / Descripción                                         |
| :----------- | :-------------- | :------------------------------------------------------------------ |
| `id`         | `UUID`          | **Primary Key**                                                     |
| `tenant_id`  | `UUID`          | **Foreign Key**.                                                    |
| `type`       | `VARCHAR`       | `'product'` (resta inventario) o `'service'` (no resta inventario). |
| `name`       | `VARCHAR`       | Nombre del ítem.                                                    |
| `price`      | `DECIMAL(10,2)` | Evita usar `FLOAT` para dinero; siempre `DECIMAL`.                  |
| `stock`      | `INT`           | `NULLABLE` (Puede ser nulo si es un servicio).                      |
| `created_at` | `TIMESTAMP`     | Fecha de creación.                                                  |
| `updated_at` | `TIMESTAMP`     | Fecha de actualización.                                             |
| `deleted_at` | `TIMESTAMP`     | Borrado lógico (Soft delete).                                       |

### D. Tabla `orders` (La cabecera de la venta)

Registra la transacción comercial general.

| Columna        | Tipo de Dato    | Restricciones / Descripción               |
| :------------- | :-------------- | :---------------------------------------- |
| `id`           | `UUID`          | **Primary Key**                           |
| `tenant_id`    | `UUID`          | **Foreign Key**.                          |
| `user_id`      | `UUID`          | **Foreign Key**. Quién procesó la venta.  |
| `status`       | `VARCHAR`       | Ej: `'pending'`, `'paid'`, `'cancelled'`. |
| `total_amount` | `DECIMAL(10,2)` | Monto total de la orden.                  |
| `created_at`   | `TIMESTAMP`     | Fecha de creación.                        |
| `updated_at`   | `TIMESTAMP`     | Fecha de actualización.                   |
| `deleted_at`   | `TIMESTAMP`     | Borrado lógico (Soft delete).             |

### E. Tabla `order_lines` (El detalle de la venta)

_Aplicación de la Primera Forma Normal (1NF):_ Cada elemento comprado es una fila nueva, evitando guardar listas separadas por comas.

| Columna      | Tipo de Dato    | Restricciones / Descripción              |
| :----------- | :-------------- | :--------------------------------------- |
| `id`         | `UUID`          | **Primary Key**                          |
| `order_id`   | `UUID`          | **Foreign Key**.                         |
| `item_id`    | `UUID`          | **Foreign Key**.                         |
| `quantity`   | `INT`           | Cantidad comprada.                       |
| `unit_price` | `DECIMAL(10,2)` | Precio unitario al momento de la compra. |
| `subtotal`   | `DECIMAL(10,2)` | `quantity` \* `unit_price`.              |

> ⚠️ **¡Punto Crítico de Normalización (2NF y 3NF)!**
> **¿Por qué guardamos el `unit_price` en `order_lines` si ya está en la tabla `items`?**
> Porque el precio de la tabla `items` puede cambiar mañana. Si no copiamos el precio al momento exacto de la venta (foto histórica), cuando el tendero suba el precio de la leche, todas las ventas del pasado se recalcularán mágicamente y arruinarás su flujo de caja. Guardar el `unit_price` aquí asegura la inmutabilidad histórica financiera.

---

### F. Tablas Modulares

Estas tablas se utilizan **solo si** el `modules_config` del `tenant` lo permite.

#### Módulo para Restaurantes: `tables` (Gestión de mesas)

_(A la tabla `orders` se le añadiría un campo opcional `table_id`)._

| Columna        | Tipo de Dato | Restricciones / Descripción |
| :------------- | :----------- | :-------------------------- |
| `id`           | `UUID`       | **Primary Key**             |
| `tenant_id`    | `UUID`       | **Foreign Key**.            |
| `table_number` | `INT`        | Número de la mesa.          |
| `status`       | `VARCHAR`    | Ej: `'free'`, `'occupied'`. |

#### Módulo para Barberías: `appointments` (Gestión de Citas)

| Columna         | Tipo de Dato   | Restricciones / Descripción             |
| :-------------- | :------------- | :-------------------------------------- |
| `id`            | `UUID`         | **Primary Key**                         |
| `tenant_id`     | `UUID`         | **Foreign Key**.                        |
| `customer_name` | `VARCHAR(255)` | Nombre del cliente.                     |
| `item_id`       | `UUID`         | **Foreign Key**. El servicio reservado. |
| `start_time`    | `TIMESTAMP`    | Fecha y hora de la cita.                |
| `status`        | `VARCHAR`      | Ej: `'scheduled'`, `'done'`.            |
