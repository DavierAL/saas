/**
 * PowerSync TypeScript Schema
 *
 * Mirrors the SQLite schema but uses PowerSync's Column/Table API.
 * PowerSync uses this to:
 *   1. Generate the SQLite CREATE TABLE statements on first launch
 *   2. Type-check sync rules
 *
 * NOTE: PowerSync stores all UUIDs as TEXT and all integers as INTEGER.
 * The `id` column is implicit (PowerSync adds it automatically as TEXT PRIMARY KEY).
 */
import { Schema, Table, Column, ColumnType } from '@powersync/react-native';

const tenants = new Table(
  {
    name:            new Column({ type: ColumnType.TEXT }),
    industry_type:   new Column({ type: ColumnType.TEXT }),
    modules_config:  new Column({ type: ColumnType.TEXT }),  // JSON stored as TEXT
    valid_until:     new Column({ type: ColumnType.TEXT }),
    created_at:      new Column({ type: ColumnType.TEXT }),
    updated_at:      new Column({ type: ColumnType.TEXT }),
    deleted_at:      new Column({ type: ColumnType.TEXT }),
  },
  { indexes: {} },
);

const users = new Table(
  {
    tenant_id:     new Column({ type: ColumnType.TEXT }),
    email:         new Column({ type: ColumnType.TEXT }),
    password_hash: new Column({ type: ColumnType.TEXT }),
    role:          new Column({ type: ColumnType.TEXT }),
    created_at:    new Column({ type: ColumnType.TEXT }),
    updated_at:    new Column({ type: ColumnType.TEXT }),
    deleted_at:    new Column({ type: ColumnType.TEXT }),
  },
  { indexes: { tenant: ['tenant_id'] } },
);

const items = new Table(
  {
    tenant_id:  new Column({ type: ColumnType.TEXT }),
    type:       new Column({ type: ColumnType.TEXT }),
    name:       new Column({ type: ColumnType.TEXT }),
    price:      new Column({ type: ColumnType.INTEGER }),
    stock:      new Column({ type: ColumnType.INTEGER }),
    created_at: new Column({ type: ColumnType.TEXT }),
    updated_at: new Column({ type: ColumnType.TEXT }),
    deleted_at: new Column({ type: ColumnType.TEXT }),
  },
  { indexes: { tenant: ['tenant_id'] } },
);

const orders = new Table(
  {
    tenant_id:    new Column({ type: ColumnType.TEXT }),
    user_id:      new Column({ type: ColumnType.TEXT }),
    status:       new Column({ type: ColumnType.TEXT }),
    total_amount: new Column({ type: ColumnType.INTEGER }),
    created_at:   new Column({ type: ColumnType.TEXT }),
    updated_at:   new Column({ type: ColumnType.TEXT }),
    deleted_at:   new Column({ type: ColumnType.TEXT }),
  },
  { indexes: { tenant: ['tenant_id'], status: ['status'] } },
);

const order_lines = new Table(
  {
    order_id:   new Column({ type: ColumnType.TEXT }),
    item_id:    new Column({ type: ColumnType.TEXT }),
    quantity:   new Column({ type: ColumnType.INTEGER }),
    unit_price: new Column({ type: ColumnType.INTEGER }),
    subtotal:   new Column({ type: ColumnType.INTEGER }),
    tenant_id:  new Column({ type: ColumnType.TEXT }),
  },
  { indexes: { order: ['order_id'], tenant: ['tenant_id'] } },
);

const tables_restaurant = new Table(
  {
    tenant_id:    new Column({ type: ColumnType.TEXT }),
    table_number: new Column({ type: ColumnType.INTEGER }),
    status:       new Column({ type: ColumnType.TEXT }),
  },
  { indexes: { tenant: ['tenant_id'] } },
);

const appointments = new Table(
  {
    tenant_id:     new Column({ type: ColumnType.TEXT }),
    customer_name: new Column({ type: ColumnType.TEXT }),
    item_id:       new Column({ type: ColumnType.TEXT }),
    start_time:    new Column({ type: ColumnType.TEXT }),
    status:        new Column({ type: ColumnType.TEXT }),
  },
  { indexes: { tenant: ['tenant_id'] } },
);

/**
 * AppSchema — the central PowerSync schema.
 * Import this wherever you instantiate PowerSyncDatabase.
 */
export const AppSchema = new Schema([
  tenants,
  users,
  items,
  orders,
  order_lines,
  tables_restaurant,
  appointments,
]);

export type Database = (typeof AppSchema)['types'];
