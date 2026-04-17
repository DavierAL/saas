import { checkout } from '../use-cases/checkout';
import type { IOrderRepositoryPort } from '../ports/order-repository.port';
import type { IItemRepositoryPort } from '../ports/item-repository.port';
import type { ITenantRepositoryPort } from '../ports/tenant-repository.port';
import type { Item, Tenant } from '@saas-pos/domain';

// ─── Fixtures ─────────────────────────────────────────────────
const makeTenant = (active: boolean): Tenant => ({
  id:             'tenant-1',
  name:           'Bodega Doña Rosa',
  industry_type:  'retail',
  modules_config: { has_inventory: true, has_tables: false, has_appointments: false },
  valid_until:    active
    ? new Date(Date.now() + 30 * 86_400_000).toISOString()
    : new Date(Date.now() - 86_400_000).toISOString(),
  created_at:     '',
  updated_at:     '',
  deleted_at:     null,
});

const makeItem = (
  id: string,
  price: number,
  stock: number | null,
): Item => ({
  id,
  tenant_id:  'tenant-1',
  type:       stock !== null ? 'product' : 'service',
  name:       `Item ${id}`,
  price,
  stock,
  created_at: '',
  updated_at: '',
  deleted_at: null,
});

const ITEMS: Item[] = [
  makeItem('prod-1',    500, 10),  // product, 10 in stock
  makeItem('prod-2',    380,  5),  // product,  5 in stock
  makeItem('service-1', 1500, null), // service, no stock
];

// ─── Mocked Repositories ─────────────────────────────────────
let orderRepo:  jest.Mocked<IOrderRepositoryPort>;
let itemRepo:   jest.Mocked<IItemRepositoryPort>;
let tenantRepo: jest.Mocked<ITenantRepositoryPort>;

beforeEach(() => {
  orderRepo = {
    insertOrderWithLines: jest.fn().mockResolvedValue(undefined),
    findByTenant:         jest.fn(),
    findById:             jest.fn(),
    updateStatus:         jest.fn(),
    getLinesByOrderId:    jest.fn(),
  };

  itemRepo = {
    findAll:        jest.fn().mockResolvedValue(ITEMS),
    findById:       jest.fn(),
    findByType:     jest.fn(),
    insert:         jest.fn(),
    update:         jest.fn(),
    softDelete:     jest.fn(),
    decrementStock: jest.fn(),
  };

  tenantRepo = {
    findById:                jest.fn().mockResolvedValue(makeTenant(true)),
    isSubscriptionActive:    jest.fn().mockResolvedValue(true),
  };
});

// ─── Tests ────────────────────────────────────────────────────
describe('checkout use case', () => {
  const deps = () => ({ orderRepo, itemRepo, tenantRepo });

  test('successful checkout: single product', async () => {
    const result = await checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines:     [{ item_id: 'prod-1', quantity: 2, unit_price: 500 }],
      },
      deps(),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.order.total_amount).toBe(1000); // 2 × 500
    expect(result.order.status).toBe('paid');
    expect(result.order.tenant_id).toBe('tenant-1');
    expect(orderRepo.insertOrderWithLines).toHaveBeenCalledTimes(1);
  });

  test('calculates correct total for mixed cart', async () => {
    const result = await checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines: [
          { item_id: 'prod-1',    quantity: 2, unit_price: 500 },  // 1000
          { item_id: 'prod-2',    quantity: 1, unit_price: 380 },  // 380
          { item_id: 'service-1', quantity: 1, unit_price: 1500 }, // 1500
        ],
      },
      deps(),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.order.total_amount).toBe(2880);
  });

  test('fails when subscription is expired', async () => {
    tenantRepo.isSubscriptionActive.mockResolvedValue(false);

    const result = await checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines:     [{ item_id: 'prod-1', quantity: 1, unit_price: 500 }],
      },
      deps(),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.reason).toMatch(/[Ss]uscripci[oó]n/);
    expect(orderRepo.insertOrderWithLines).not.toHaveBeenCalled();
  });

  test('fails when stock is insufficient', async () => {
    itemRepo.findAll.mockResolvedValue([makeItem('prod-1', 500, 2)]); // only 2

    const result = await checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines:     [{ item_id: 'prod-1', quantity: 5, unit_price: 500 }],
      },
      deps(),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.reason).toMatch(/[Ss]tock/);
    expect(orderRepo.insertOrderWithLines).not.toHaveBeenCalled();
  });

  test('services bypass stock validation', async () => {
    const result = await checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines:     [{ item_id: 'service-1', quantity: 999, unit_price: 1500 }],
      },
      deps(),
    );

    expect(result.success).toBe(true);
  });

  test('generated order has unique id', async () => {
    const [r1, r2] = await Promise.all([
      checkout({ tenant_id: 'tenant-1', user_id: 'user-1', lines: [{ item_id: 'prod-1', quantity: 1, unit_price: 500 }] }, deps()),
      checkout({ tenant_id: 'tenant-1', user_id: 'user-1', lines: [{ item_id: 'prod-1', quantity: 1, unit_price: 500 }] }, deps()),
    ]);

    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect(r1.order.id).not.toBe(r2.order.id);
    }
  });

  test('insertOrderWithLines is called with correct order lines count', async () => {
    await checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines: [
          { item_id: 'prod-1', quantity: 1, unit_price: 500 },
          { item_id: 'prod-2', quantity: 2, unit_price: 380 },
        ],
      },
      deps(),
    );

    const [_order, lines] = orderRepo.insertOrderWithLines.mock.calls[0]!;
    expect(lines).toHaveLength(2);
  });
});
