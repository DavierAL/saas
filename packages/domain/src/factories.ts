/**
 * Domain Entity Factories  [DOM-004]
 *
 * Factory functions enforce invariants at construction time.
 * They replace "any object that matches the interface" with
 * validated, runtime-safe domain objects.
 *
 * Note: These factories are for domain-level validation only.
 * Persistence/hydration from DB rows bypasses these (use type-casts there).
 */

import type { Item, ItemType } from './entities/item';
import type { Order, OrderStatus } from './entities/order';
import type { OrderLine } from './entities/order-line';
import { ValidationError } from './errors';

// ─── Item factory ─────────────────────────────────────────────────────────────

interface CreateItemInput {
  id: string;
  tenant_id: string;
  type: ItemType;
  name: string;
  price: number;          // integer cents
  stock: number | null;   // null for services
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export const createItem = (input: CreateItemInput): Item => {
  if (!input.id) throw new ValidationError('Item id is required', 'id');
  if (!input.tenant_id) throw new ValidationError('Item tenant_id is required', 'tenant_id');
  if (!input.name.trim()) throw new ValidationError('Item name cannot be empty', 'name');
  if (!Number.isInteger(input.price) || input.price < 0)
    throw new ValidationError('Item price must be a non-negative integer (cents)', 'price');
  if (input.type === 'product' && input.stock !== null && (!Number.isInteger(input.stock) || input.stock < 0))
    throw new ValidationError('Stock must be a non-negative integer for products', 'stock');
  if (input.type === 'service' && input.stock !== null)
    throw new ValidationError('Services must have null stock', 'stock');

  return {
    id:         input.id,
    tenant_id:  input.tenant_id,
    type:       input.type,
    name:       input.name.trim(),
    price:      input.price,
    stock:      input.stock,
    created_at: input.created_at,
    updated_at: input.updated_at,
    deleted_at: input.deleted_at ?? null,
  };
};

// ─── Order factory ────────────────────────────────────────────────────────────

interface CreateOrderInput {
  id: string;
  tenant_id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number; // integer cents
  currency: string;     // [DOM-008]
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export const createOrder = (input: CreateOrderInput): Order => {
  if (!input.id)        throw new ValidationError('Order id is required', 'id');
  if (!input.tenant_id) throw new ValidationError('Order tenant_id is required', 'tenant_id');
  if (!input.user_id)   throw new ValidationError('Order user_id is required', 'user_id');
  if (!Number.isInteger(input.total_amount) || input.total_amount < 0)
    throw new ValidationError('Order total_amount must be a non-negative integer (cents)', 'total_amount');
  if (!input.currency || input.currency.trim() === '')
    throw new ValidationError('Order currency is required', 'currency');

  return {
    id:           input.id,
    tenant_id:    input.tenant_id,
    user_id:      input.user_id,
    status:       input.status,
    total_amount: input.total_amount,
    currency:     input.currency.trim().toUpperCase(),
    created_at:   input.created_at,
    updated_at:   input.updated_at,
    deleted_at:   input.deleted_at ?? null,
  };
};

// ─── OrderLine factory ────────────────────────────────────────────────────────

interface CreateOrderLineInput {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;  // integer cents
  subtotal: number;    // integer cents
  tenant_id: string;
}

export const createOrderLine = (input: CreateOrderLineInput): OrderLine => {
  if (!input.id)       throw new ValidationError('OrderLine id is required', 'id');
  if (!input.order_id) throw new ValidationError('OrderLine order_id is required', 'order_id');
  if (!input.item_id)  throw new ValidationError('OrderLine item_id is required', 'item_id');
  if (!Number.isInteger(input.quantity) || input.quantity <= 0)
    throw new ValidationError('OrderLine quantity must be a positive integer', 'quantity');
  if (!Number.isInteger(input.unit_price) || input.unit_price < 0)
    throw new ValidationError('OrderLine unit_price must be non-negative integer (cents)', 'unit_price');
  if (!Number.isInteger(input.subtotal) || input.subtotal < 0)
    throw new ValidationError('OrderLine subtotal must be non-negative integer (cents)', 'subtotal');

  return {
    id:         input.id,
    order_id:   input.order_id,
    item_id:    input.item_id,
    quantity:   input.quantity,
    unit_price: input.unit_price,
    subtotal:   input.subtotal,
    tenant_id:  input.tenant_id,
  };
};
