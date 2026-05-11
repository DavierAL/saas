import type { Order, OrderStatus, PaymentMethod } from '@saas-pos/domain';
import type { Item, ItemType } from '@saas-pos/domain';
import type { Tenant, IndustryType, ModulesConfig } from '@saas-pos/domain';
import type { User, UserRole } from '@saas-pos/domain';
import type { OrderLine } from '@saas-pos/domain';

const generateId = () => 'id-' + Math.random().toString(36).substr(2, 9);
const now = () => new Date().toISOString();

export const orderBuilder = (overrides: Partial<Order> = {}): Order => ({
  id: generateId(),
  tenant_id: 'tenant-1',
  user_id: 'user-1',
  customer_id: null,
  customer_name: null,
  status: 'pending' as OrderStatus,
  total_amount: 1000,
  tip_amount: 0,
  currency: 'PEN',
  payment_method: 'cash' as PaymentMethod | null,
  created_at: now(),
  updated_at: now(),
  deleted_at: null,
  ...overrides
});

export const itemBuilder = (overrides: Partial<Item> = {}): Item => ({
  id: generateId(),
  tenant_id: 'tenant-1',
  type: 'product' as ItemType,
  name: 'Test Item',
  price: 1000,
  stock: 100,
  duration_minutes: null,
  created_at: now(),
  updated_at: now(),
  deleted_at: null,
  ...overrides
});

export const tenantBuilder = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: generateId(),
  name: 'Test Tenant',
  industry_type: 'restaurant' as IndustryType,
  modules_config: {
    has_inventory: true,
    has_tables: true,
    has_appointments: false
  } as ModulesConfig,
  valid_until: '2027-12-31T23:59:59Z',
  currency: 'PEN',
  created_at: now(),
  updated_at: now(),
  deleted_at: null,
  ...overrides
});

export const userBuilder = (overrides: Partial<User> = {}): User => ({
  id: generateId(),
  tenant_id: 'tenant-1',
  email: 'test@example.com',
  role: 'cashier' as UserRole,
  created_at: now(),
  updated_at: now(),
  deleted_at: null,
  ...overrides
});

export const orderLineBuilder = (overrides: Partial<OrderLine> = {}): OrderLine => ({
  id: generateId(),
  order_id: 'order-1',
  item_id: 'item-1',
  quantity: 1,
  unit_price: 1000,
  subtotal: 1000,
  tenant_id: 'tenant-1',
  ...overrides
});

export const createOrderList = (count: number, overrides: Partial<Order> = {}): Order[] =>
  Array.from({ length: count }, (_, i) => orderBuilder({
    id: `order-${i}`,
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
    ...overrides
  }));

export const createItemList = (count: number, overrides: Partial<Item> = {}): Item[] =>
  Array.from({ length: count }, (_, i) => itemBuilder({
    id: `item-${i}`,
    name: `Item ${i + 1}`,
    ...overrides
  }));