import { SqliteItemRepository } from '../sqlite/repositories/item-repository';
import type { PowerSyncDatabase } from '@powersync/react-native';

describe('SqliteItemRepository', () => {
  let db: jest.Mocked<PowerSyncDatabase>;
  let repo: SqliteItemRepository;

  beforeEach(() => {
    db = {
      getAll:  jest.fn(),
      get:     jest.fn(),
      execute: jest.fn(),
    } as any;
    repo = new SqliteItemRepository(db);
  });

  test('findAll: formats query correctly', async () => {
    db.getAll.mockResolvedValue([]);
    await repo.findAll('tenant-1');

    expect(db.getAll).toHaveBeenCalledWith(
      expect.stringMatching(/SELECT.*FROM items/is),
      ['tenant-1']
    );
  });

  test('insert: executes correct SQL', async () => {
    const itemData = {
      tenant_id: 'tenant-1',
      type:      'product' as const,
      name:      'New Product',
      price:     1500,
      stock:     50,
    };

    const result = await repo.insert(itemData, 'tenant-1');

    expect(result.name).toBe('New Product');
    expect(db.execute).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO items/is),
      expect.arrayContaining([result.id, 'tenant-1', 'product', 1500, 50])
    );
  });

  test('decrementStock: handles atomic update', async () => {
    await repo.decrementStock('item-1', 5, 'tenant-1');

    expect(db.execute).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE items.*SET stock = stock - \?/is),
      [5, expect.any(String), 'item-1', 'tenant-1']
    );
  });

  test('softDelete: updates deleted_at field', async () => {
    await repo.softDelete('item-1', 'tenant-1');

    expect(db.execute).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE items.*SET deleted_at = \?/is),
      [expect.any(String), expect.any(String), 'item-1', 'tenant-1']
    );
  });

  test('findById: formats query correctly', async () => {
    db.get.mockResolvedValue(null);
    await repo.findById('item-1', 'tenant-1');

    expect(db.get).toHaveBeenCalledWith(
      expect.stringMatching(/SELECT.*FROM items WHERE id = \?/is),
      ['item-1', 'tenant-1']
    );
  });

  test('findByType: filters by type', async () => {
    db.getAll.mockResolvedValue([]);
    await repo.findByType('service', 'tenant-1');

    expect(db.getAll).toHaveBeenCalledWith(
      expect.stringMatching(/WHERE tenant_id = \? AND type = \?/is),
      ['tenant-1', 'service']
    );
  });

  test('update: builds dynamic SQL for partial updates', async () => {
    await repo.update('item-1', { price: 2000, stock: 5 }, 'tenant-1');

    expect(db.execute).toHaveBeenCalledWith(
      expect.stringMatching(/UPDATE items SET price = \?, stock = \?, updated_at = \?/is),
      [2000, 5, expect.any(String), 'item-1', 'tenant-1']
    );
  });

  test('update: no-op if patch is empty', async () => {
    await repo.update('item-1', {}, 'tenant-1');
    expect(db.execute).not.toHaveBeenCalled();
  });
});
