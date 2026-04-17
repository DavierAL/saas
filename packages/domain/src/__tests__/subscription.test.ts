import { getSubscriptionStatus } from '../rules/subscription';
import type { Tenant } from '../entities/tenant';

// Helper: build a tenant expiring N days from now (negative = already expired)
const makeTenant = (daysFromNow: number): Tenant => ({
  id:              'test-tenant',
  name:            'Test Bodega',
  industry_type:   'retail',
  modules_config:  { has_inventory: true, has_tables: false, has_appointments: false },
  valid_until:     new Date(Date.now() + daysFromNow * 86_400_000).toISOString(),
  created_at:      new Date().toISOString(),
  updated_at:      new Date().toISOString(),
  deleted_at:      null,
});

describe('getSubscriptionStatus', () => {
  describe('isActive', () => {
    test('30 days remaining → active', () => {
      expect(getSubscriptionStatus(makeTenant(30)).isActive).toBe(true);
    });

    test('1 day remaining → active', () => {
      expect(getSubscriptionStatus(makeTenant(1)).isActive).toBe(true);
    });

    test('expired yesterday → inactive', () => {
      expect(getSubscriptionStatus(makeTenant(-1)).isActive).toBe(false);
    });

    test('expired 30 days ago → inactive', () => {
      expect(getSubscriptionStatus(makeTenant(-30)).isActive).toBe(false);
    });
  });

  describe('isExpiringSoon', () => {
    test('3 days → expiring soon', () => {
      expect(getSubscriptionStatus(makeTenant(3)).isExpiringSoon).toBe(true);
    });

    test('5 days → expiring soon (boundary)', () => {
      expect(getSubscriptionStatus(makeTenant(5)).isExpiringSoon).toBe(true);
    });

    test('6 days → not expiring soon', () => {
      expect(getSubscriptionStatus(makeTenant(6)).isExpiringSoon).toBe(false);
    });

    test('30 days → not expiring soon', () => {
      expect(getSubscriptionStatus(makeTenant(30)).isExpiringSoon).toBe(false);
    });

    test('expired → not expiring soon (already done)', () => {
      expect(getSubscriptionStatus(makeTenant(-1)).isExpiringSoon).toBe(false);
    });
  });

  describe('daysRemaining', () => {
    test('0 when expired', () => {
      expect(getSubscriptionStatus(makeTenant(-5)).daysRemaining).toBe(0);
    });

    test('approximately 30 when 30 days ahead', () => {
      const { daysRemaining } = getSubscriptionStatus(makeTenant(30));
      expect(daysRemaining).toBeGreaterThanOrEqual(29);
      expect(daysRemaining).toBeLessThanOrEqual(31);
    });

    test('approximately 1 when 1 day ahead', () => {
      const { daysRemaining } = getSubscriptionStatus(makeTenant(1));
      expect(daysRemaining).toBeGreaterThanOrEqual(0);
      expect(daysRemaining).toBeLessThanOrEqual(2);
    });
  });
});
