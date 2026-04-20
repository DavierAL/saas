import { checkout } from '../use-cases/checkout';
import type { IOrderRepositoryPort } from '../ports/order-repository.port';
import type { IItemRepositoryPort } from '../ports/item-repository.port';
import type { ITenantRepositoryPort } from '../ports/tenant-repository.port';
import { SubscriptionExpiredError, InsufficientStockError, itemBuilder, tenantBuilder } from '@saas-pos/domain';

// Fixtures now handled via Builders in test-utils/builders.ts

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
    findAll:        jest.fn(),
    findById:       jest.fn(),
    findByType:     jest.fn(),
    insert:         jest.fn(),
    update:         jest.fn(),
    softDelete:     jest.fn(),
    decrementStock: jest.fn().mockResolvedValue(undefined),
  };

  tenantRepo = {
    findById: jest.fn().mockResolvedValue(tenantBuilder().active().build()),
    isSubscriptionActive: jest.fn().mockResolvedValue(true), // Now redundant but kept for interface compliance
  };
});

// ─── Tests ────────────────────────────────────────────────────
describe('checkout use case', () => {
  const deps = () => ({ orderRepo, itemRepo, tenantRepo });

  test('successful checkout: single product', async () => {
    itemRepo.findAll.mockResolvedValue([
      itemBuilder().withId('prod-1').withStock(10).build(),
    ]);

    const order = await checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines:     [{ item_id: 'prod-1', quantity: 2, unit_price: 500 }],
      },
      deps(),
    );

    expect(order.total_amount).toBe(1000);
    expect(orderRepo.insertOrderWithLines).toHaveBeenCalledTimes(1);
    // [TEST-002] Stock decrement is now handled by insertOrderWithLines!
    expect(itemRepo.decrementStock).not.toHaveBeenCalled();
  });

  test('calculates correct total for mixed cart', async () => {
    itemRepo.findAll.mockResolvedValue([
      itemBuilder().withId('prod-1').withStock(10).build(),
      itemBuilder().withId('prod-2').withStock(5).build(),
      itemBuilder().withId('service-1').withType('service').build(),
    ]);

    const order = await checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines: [
          { item_id: 'prod-1',    quantity: 2, unit_price: 500 },
          { item_id: 'prod-2',    quantity: 1, unit_price: 380 },
          { item_id: 'service-1', quantity: 1, unit_price: 1500 },
        ],
      },
      deps(),
    );

    expect(order.total_amount).toBe(2880);
  });

  test('fails when subscription is expired [TEST-007]', async () => {
    tenantRepo.isSubscriptionActive.mockResolvedValue(false);

    const promise = checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines:     [{ item_id: 'prod-1', quantity: 1, unit_price: 500 }],
      },
      deps(),
    );

    await expect(promise).rejects.toThrow(SubscriptionExpiredError);
    expect(orderRepo.insertOrderWithLines).not.toHaveBeenCalled();
  });

  test('fails when stock is insufficient [TEST-007]', async () => {
    itemRepo.findAll.mockResolvedValue([
      itemBuilder().withId('prod-1').withStock(2).build(), // only 2
    ]);

    const promise = checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines:     [{ item_id: 'prod-1', quantity: 5, unit_price: 500 }],
      },
      deps(),
    );

    await expect(promise).rejects.toThrow(InsufficientStockError);
    expect(orderRepo.insertOrderWithLines).not.toHaveBeenCalled();
  });

  test('services bypass stock validation', async () => {
    itemRepo.findAll.mockResolvedValue([
      itemBuilder().withId('service-1').withType('service').build(),
    ]);

    const order = await checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines:     [{ item_id: 'service-1', quantity: 999, unit_price: 1500 }],
      },
      deps(),
    );

    expect(order.id).toBeDefined();
    expect(itemRepo.decrementStock).not.toHaveBeenCalled();
  });

  test('generated order has unique id', async () => {
    itemRepo.findAll.mockResolvedValue([itemBuilder().withId('prod-1').build()]);

    const [o1, o2] = await Promise.all([
      checkout({ tenant_id: 'tenant-1', user_id: 'user-1', lines: [{ item_id: 'prod-1', quantity: 1, unit_price: 500 }] }, deps()),
      checkout({ tenant_id: 'tenant-1', user_id: 'user-1', lines: [{ item_id: 'prod-1', quantity: 1, unit_price: 500 }] }, deps()),
    ]);

    expect(o1.id).not.toBe(o2.id);
  });

  test('insertOrderWithLines is called with correct order lines count', async () => {
    itemRepo.findAll.mockResolvedValue([
      itemBuilder().withId('prod-1').withStock(10).build(),
      itemBuilder().withId('prod-2').withStock(10).build(),
    ]);

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

  test('fails when tenant is not found', async () => {
    tenantRepo.findById.mockResolvedValue(null);

    const promise = checkout(
      {
        tenant_id: 'non-existent',
        user_id:   'user-1',
        lines:     [{ item_id: 'prod-1', quantity: 1, unit_price: 500 }],
      },
      deps(),
    );

    await expect(promise).rejects.toThrow('Tenant not found');
  });

  test('fails when subscription is expired (using domain logic)', async () => {
    tenantRepo.findById.mockResolvedValue(tenantBuilder().expired().build());

    const promise = checkout(
      {
        tenant_id: 'tenant-1',
        user_id:   'user-1',
        lines:     [{ item_id: 'prod-1', quantity: 1, unit_price: 500 }],
      },
      deps(),
    );

    await expect(promise).rejects.toThrow(SubscriptionExpiredError);
  });
});
