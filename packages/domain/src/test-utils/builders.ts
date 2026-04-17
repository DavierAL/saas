import type { Item, ItemType } from '../entities/item';
import type { Order, OrderStatus } from '../entities/order';
import type { Tenant } from '../entities/tenant';
import { nowISO, generateId } from '@saas-pos/utils';

/**
 * [TEST-006] Test Data Builders
 * Using the Builder Pattern for test fixtures provides:
 * 1. Default valid objects: Tests only need to specify what matters for that case.
 * 2. Fluent API: `itemBuilder().withPrice(100).build()` is more readable.
 * 3. Resilience: If an interface changes, only the builder needs updating.
 */

export class ItemBuilder {
  private item: Item = {
    id:         generateId(),
    tenant_id:  'tenant-1',
    type:       'product',
    name:       'Test Item',
    price:      1000,
    stock:      10,
    created_at: nowISO(),
    updated_at: nowISO(),
    deleted_at: null,
  };

  withId(id: string) {
    this.item = { ...this.item, id };
    return this;
  }

  withType(type: ItemType) {
    this.item = { ...this.item, type, stock: type === 'service' ? null : this.item.stock };
    return this;
  }

  withPrice(price: number) {
    this.item = { ...this.item, price };
    return this;
  }

  withStock(stock: number | null) {
    this.item = { ...this.item, stock };
    return this;
  }

  withTenant(tenantId: string) {
    this.item = { ...this.item, tenant_id: tenantId };
    return this;
  }

  build(): Item {
    return { ...this.item };
  }
}

export class TenantBuilder {
  private tenant: Tenant = {
    id:             'tenant-1',
    name:           'Test Tenant',
    industry_type:  'retail',
    modules_config: { has_inventory: true, has_tables: false, has_appointments: false },
    valid_until:    nowISO(), // Default is expiring NOW
    currency:       'PEN',
    created_at:     nowISO(),
    updated_at:     nowISO(),
    deleted_at:     null,
  };

  withId(id: string) {
    this.tenant = { ...this.tenant, id };
    return this;
  }

  active() {
    const future = new Date(Date.now() + 30 * 86_400_000).toISOString();
    this.tenant = { ...this.tenant, valid_until: future };
    return this;
  }

  expired() {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    this.tenant = { ...this.tenant, valid_until: past };
    return this;
  }

  withCurrency(currency: string) {
    this.tenant = { ...this.tenant, currency };
    return this;
  }

  build(): Tenant {
    return { ...this.tenant };
  }
}

export class OrderBuilder {
  private order: Order = {
    id:           generateId(),
    tenant_id:    'tenant-1',
    user_id:      'user-1',
    status:       'paid',
    total_amount: 1000,
    currency:     'PEN',
    created_at:   nowISO(),
    updated_at:   nowISO(),
    deleted_at:   null,
  };

  withStatus(status: OrderStatus) {
    this.order = { ...this.order, status };
    return this;
  }

  withTotal(amount: number) {
    this.order = { ...this.order, total_amount: amount };
    return this;
  }

  build(): Order {
    return { ...this.order };
  }
}

export const itemBuilder   = () => new ItemBuilder();
export const tenantBuilder = () => new TenantBuilder();
export const orderBuilder  = () => new OrderBuilder();
