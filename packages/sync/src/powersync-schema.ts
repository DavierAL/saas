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
import { Schema, Table, ColumnType } from '@powersync/react-native';

const tenants = new Table(
  {
    name:            { type: ColumnType.TEXT },
    industry_type:   { type: ColumnType.TEXT },
    modules_config:  { type: ColumnType.TEXT },
    valid_until:     { type: ColumnType.TEXT },
    created_at:      { type: ColumnType.TEXT },
    updated_at:      { type: ColumnType.TEXT },
    deleted_at:      { type: ColumnType.TEXT },
  },
  { indexes: {} },
);

const users = new Table(
  {
    tenant_id:     { type: ColumnType.TEXT },
    email:         { type: ColumnType.TEXT },
    role:          { type: ColumnType.TEXT },
    created_at:    { type: ColumnType.TEXT },
    updated_at:    { type: ColumnType.TEXT },
    deleted_at:    { type: ColumnType.TEXT },
  },
  { indexes: { tenant: ['tenant_id'] } },
);

const items = new Table(
  {
    tenant_id:  { type: ColumnType.TEXT },
    type:       { type: ColumnType.TEXT },
    name:       { type: ColumnType.TEXT },
    price:      { type: ColumnType.INTEGER },
    stock:      { type: ColumnType.INTEGER },
    created_at: { type: ColumnType.TEXT },
    updated_at: { type: ColumnType.TEXT },
    deleted_at: { type: ColumnType.TEXT },
  },
  { indexes: { tenant: ['tenant_id'] } },
);

const orders = new Table(
  {
    tenant_id:    { type: ColumnType.TEXT },
    user_id:      { type: ColumnType.TEXT },
    status:       { type: ColumnType.TEXT },
    total_amount: { type: ColumnType.INTEGER },
    created_at:   { type: ColumnType.TEXT },
    updated_at:   { type: ColumnType.TEXT },
    deleted_at:   { type: ColumnType.TEXT },
  },
  { indexes: { tenant: ['tenant_id'], status: ['status'] } },
);

const order_lines = new Table(
  {
    order_id:   { type: ColumnType.TEXT },
    item_id:    { type: ColumnType.TEXT },
    quantity:   { type: ColumnType.INTEGER },
    unit_price: { type: ColumnType.INTEGER },
    subtotal:   { type: ColumnType.INTEGER },
    tenant_id:  { type: ColumnType.TEXT },
  },
  { indexes: { order: ['order_id'], tenant: ['tenant_id'] } },
);

const tables_restaurant = new Table(
  {
    tenant_id:    { type: ColumnType.TEXT },
    table_number: { type: ColumnType.INTEGER },
    status:       { type: ColumnType.TEXT },
  },
  { indexes: { tenant: ['tenant_id'] } },
);

const appointments = new Table(
  {
    tenant_id:     { type: ColumnType.TEXT },
    customer_name: { type: ColumnType.TEXT },
    item_id:       { type: ColumnType.TEXT },
    start_time:    { type: ColumnType.TEXT },
    status:        { type: ColumnType.TEXT },
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
