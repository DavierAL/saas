import type { Tenant } from '../entities/tenant';

export interface SubscriptionStatus {
  readonly isActive: boolean;
  readonly daysRemaining: number;
  readonly hoursRemaining: number;
  readonly isExpiringSoon: boolean;
}

export const getSubscriptionStatus = (tenant: Tenant, warningDays = 5): SubscriptionStatus => {
  const now = new Date();
  const validUntil = new Date(tenant.valid_until);
  const diffMs = validUntil.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { isActive: false, daysRemaining: 0, hoursRemaining: 0, isExpiringSoon: false };
  }

  // [DOM-011] Use Math.floor instead of Math.ceil for precision
  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const hoursRemaining = totalHours % 24;

  return {
    isActive: true,
    daysRemaining,
    hoursRemaining,
    // [DOM-010] Make threshold configurable
    isExpiringSoon: daysRemaining <= warningDays,
  };
};
