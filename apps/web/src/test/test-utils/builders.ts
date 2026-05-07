import type { Order, Item, Tenant, User, OrderLine } from '@saas-pos/domain';

export const orderBuilder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-' + Math.random().toString(36).substr(2, 9),
  tenant_id: 'tenant-1',
  customer_id: null,
  status: 'pending',
  total_amount: 1000,
  currency: 'PEN',
  payment_method: 'cash',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const itemBuilder = (overrides: Partial<Item> = {}): Item => ({
  id: 'item-' + Math.random().toString(36).substr(2, 9),
  tenant_id: 'tenant-1',
  name: 'Test Item',
  description: null,
  price: 1000,
  cost: 500,
  current_stock: 100,
  low_stock_threshold: 10,
  category: 'food',
  image_url: null,
  is_available: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const tenantBuilder = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: 'tenant-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Tenant',
  slug: 'test-tenant',
  status: 'active',
  plan: 'free',
  settings: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const userBuilder = (overrides: Partial<User> = {}): User => ({
  id: 'user-' + Math.random().toString(36).substr(2, 9),
  tenant_id: 'tenant-1',
  email: 'test@example.com',
  role: 'cashier',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const orderLineBuilder = (overrides: Partial<OrderLine> = {}): OrderLine => ({
  id: 'line-' + Math.random().toString(36).substr(2, 9),
  order_id: 'order-1',
  item_id: 'item-1',
  quantity: 1,
  unit_price: 1000,
  subtotal: 1000,
  created_at: new Date().toISOString(),
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