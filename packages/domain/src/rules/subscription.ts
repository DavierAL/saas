import type { Tenant } from '../entities/tenant';

export interface SubscriptionStatus {
  readonly isActive: boolean;
  readonly daysRemaining: number;
  readonly isExpiringSoon: boolean;  // <= 5 days
}

export const getSubscriptionStatus = (tenant: Tenant): SubscriptionStatus => {
  const now = new Date();
  const validUntil = new Date(tenant.valid_until);
  const diffMs = validUntil.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    isActive: daysRemaining > 0,
    daysRemaining: Math.max(0, daysRemaining),
    isExpiringSoon: daysRemaining > 0 && daysRemaining <= 5,
  };
};
