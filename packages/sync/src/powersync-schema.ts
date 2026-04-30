import { column, Schema, Table } from '@powersync/react-native';

const tenants = new Table(
  {
    // id column (text) is automatically included
    name: column.text,
    industry_type: column.text,
    modules_config: column.text,
    valid_until: column.text,
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
    currency: column.text,
    last_remote_validation_at: column.text
  },
  { indexes: {} }
);

const users = new Table(
  {
    // id column (text) is automatically included
    tenant_id: column.text,
    email: column.text,
    password_hash: column.text,
    role: column.text,
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text
  },
  { indexes: {} }
);

const items = new Table(
  {
    // id column (text) is automatically included
    tenant_id: column.text,
    type: column.text,
    name: column.text,
    price: column.integer,
    stock: column.integer,
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text
  },
  { indexes: {} }
);

const orders = new Table(
  {
    // id column (text) is automatically included
    tenant_id: column.text,
    user_id: column.text,
    status: column.text,
    total_amount: column.integer,
    created_at: column.text,
    updated_at: column.text,
    deleted_at: column.text,
    currency: column.text,
    customer_name: column.text
  },
  { indexes: {} }
);

const order_lines = new Table(
  {
    // id column (text) is automatically included
    order_id: column.text,
    item_id: column.text,
    quantity: column.integer,
    unit_price: column.integer,
    subtotal: column.integer,
    tenant_id: column.text
  },
  { indexes: {} }
);

const tables_restaurant = new Table(
  {
    // id column (text) is automatically included
    tenant_id: column.text,
    table_number: column.integer,
    status: column.text
  },
  { indexes: {} }
);

const appointments = new Table(
  {
    // id column (text) is automatically included
    tenant_id: column.text,
    customer_name: column.text,
    item_id: column.text,
    start_time: column.text,
    status: column.text
  },
  { indexes: {} }
);

export const AppSchema = new Schema({
  tenants,
  users,
  items,
  orders,
  order_lines,
  tables_restaurant,
  appointments
});

export type Database = (typeof AppSchema)['types'];
