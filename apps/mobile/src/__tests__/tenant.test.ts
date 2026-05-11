import { describe, test, expect } from 'vitest';
import {
  createTenant,
  isTenantSubscriptionActive,
} from '@saas-pos/domain';

const DEFAULT_MODULES = { has_inventory: false, has_tables: false, has_appointments: false };

describe('Tenant Entity', () => {
  describe('createTenant', () => {
    test('creates tenant with default PEN currency', () => {
      const tenant = createTenant({
        id: 'tenant-1',
        name: 'Mi Restaurante',
        industry_type: 'restaurant',
        modules_config: DEFAULT_MODULES,
        valid_until: '2027-01-01T00:00:00.000Z',
      });
      expect(tenant.currency).toBe('PEN');
    });

    test('creates tenant with custom currency', () => {
      const tenant = createTenant({
        id: 'tenant-1',
        name: 'Mi Restaurante',
        industry_type: 'restaurant',
        modules_config: DEFAULT_MODULES,
        valid_until: '2027-01-01T00:00:00.000Z',
        currency: 'USD',
      });
      expect(tenant.currency).toBe('USD');
    });

    test('sets created_at and updated_at', () => {
      const tenant = createTenant({
        id: 'tenant-1',
        name: 'Mi Restaurante',
        industry_type: 'restaurant',
        modules_config: DEFAULT_MODULES,
        valid_until: '2027-01-01T00:00:00.000Z',
      });
      expect(tenant.created_at).toBeDefined();
      expect(tenant.updated_at).toBeDefined();
      expect(tenant.deleted_at).toBeNull();
    });
  });

  describe('isTenantSubscriptionActive', () => {
    test('returns true for future valid_until', () => {
      const tenant = createTenant({
        id: 'tenant-1',
        name: 'Mi Restaurante',
        industry_type: 'restaurant',
        modules_config: DEFAULT_MODULES,
        valid_until: '2027-01-01T00:00:00.000Z',
      });
      expect(isTenantSubscriptionActive(tenant)).toBe(true);
    });

    test('returns false for past valid_until', () => {
      const tenant = createTenant({
        id: 'tenant-1',
        name: 'Mi Restaurante',
        industry_type: 'restaurant',
        modules_config: DEFAULT_MODULES,
        valid_until: '2020-01-01T00:00:00.000Z',
      });
      expect(isTenantSubscriptionActive(tenant)).toBe(false);
    });
  });
});
