import { SqliteOrderRepository } from '../sqlite/repositories/order-repository';
import type { PowerSyncDatabase } from '@powersync/react-native';
import type { Order, OrderLine } from '@saas-pos/domain';

describe('SqliteOrderRepository', () => {
  let db: jest.Mocked<PowerSyncDatabase>;
  let tx: { execute: jest.Mock };
  let repo: SqliteOrderRepository;

  beforeEach(() => {
    tx = { execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }) };
    db = {
      writeTransaction: jest.fn((cb) => cb(tx)),
      getAll:  jest.fn(),
      get:     jest.fn(),
      execute: jest.fn(),
    } as any;
    repo = new SqliteOrderRepository(db);
  });

  test('insertOrderWithLines: executes order, lines and stock updates in a single transaction', async () => {
    const order: Order = {
      id:           'order-1',
      tenant_id:    'tenant-1',
      user_id:      'user-1',
      status:       'paid',
      total_amount: 1000,
      currency:     'PEN',
      created_at:   '2026-04-19T21:15:00Z',
      updated_at:   '2026-04-19T21:15:00Z',
      deleted_at:   null,
    };

    const lines: OrderLine[] = [
      {
        id:         'line-1',
        order_id:   'order-1',
        item_id:    'item-1',
        quantity:   2,
        unit_price: 500,
        subtotal:   1000,
        tenant_id:  'tenant-1',
      },
    ];

    await repo.insertOrderWithLines(order, lines);

    // 1. Verify transaction was started
    expect(db.writeTransaction).toHaveBeenCalledTimes(1);

    // 2. Verify Order header insertion
    expect(tx.execute).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO orders/i),
      ['order-1', 'tenant-1', 'user-1', 'paid', 1000, 'PEN', expect.any(String), expect.any(String)]
    );

    // 3. Verify Order line insertion
    expect(tx.execute).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO order_lines/i),
      ['line-1', 'order-1', 'item-1', 2, 500, 1000, 'tenant-1']
    );

    // 4. Verify Stock decrement — this is the redundant part being checked!
    // It must happen here so we can safely remove it from the use case.
    expect(tx.execute).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE items.*SET stock = stock - \?/is),
      [2, expect.any(String), 'item-1', 'tenant-1']
    );
  });

  test('findById: formats query correctly', async () => {
    db.get.mockResolvedValue(null);
    await repo.findById('order-1', 'tenant-1');

    expect(db.get).toHaveBeenCalledWith(
      expect.stringMatching(/SELECT.*FROM orders WHERE id = \? AND tenant_id = \?/is),
      ['order-1', 'tenant-1']
    );
  });
});
