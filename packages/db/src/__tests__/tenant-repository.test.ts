import { SqliteTenantRepository } from '../sqlite/repositories/tenant-repository';
import type { PowerSyncDatabase } from '@powersync/react-native';

describe('SqliteTenantRepository', () => {
  let db: jest.Mocked<PowerSyncDatabase>;
  let repo: SqliteTenantRepository;

  beforeEach(() => {
    db = {
      get: jest.fn(),
    } as any;
    repo = new SqliteTenantRepository(db);
  });

  test('findById: parses valid modules_config', async () => {
    const mockTenant = {
      id: 't1',
      name: 'Test',
      industry_type: 'retail',
      modules_config: JSON.stringify({ has_inventory: true, has_tables: false, has_appointments: false }),
      valid_until: '2099-01-01',
      currency: 'PEN',
      created_at: '2026-04-19',
      updated_at: '2026-04-19',
      deleted_at: null,
    };
    db.get.mockResolvedValue(mockTenant);

    const result = await repo.findById('t1');

    expect(result?.modules_config.has_inventory).toBe(true);
    expect(db.get).toHaveBeenCalledWith(expect.stringMatching(/SELECT.*FROM tenants/is), ['t1']);
  });

  test('findById: falls back to default on corrupted JSON', async () => {
    const mockTenant = {
      id: 't1',
      modules_config: 'INVALID_JSON',
    };
    db.get.mockResolvedValue(mockTenant);

    const result = await repo.findById('t1');

    expect(result?.modules_config.has_inventory).toBe(false);
    expect(result?.modules_config.has_tables).toBe(false);
  });

  test('findById: returns null if not found', async () => {
    db.get.mockResolvedValue(null);
    const result = await repo.findById('t2');
    expect(result).toBeNull();
  });

  test('isSubscriptionActive: returns true for future date', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    db.get.mockResolvedValue({ valid_until: futureDate, modules_config: '{}' });

    const result = await repo.isSubscriptionActive('t1');
    expect(result).toBe(true);
  });

  test('isSubscriptionActive: returns false for past date', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    db.get.mockResolvedValue({ valid_until: pastDate, modules_config: '{}' });

    const result = await repo.isSubscriptionActive('t1');
    expect(result).toBe(false);
  });
});
