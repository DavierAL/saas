import type { Tenant } from '@saas-pos/domain';

export interface ITenantRepositoryPort {
  findById(id: string): Promise<Tenant | null>;
  isSubscriptionActive(id: string): Promise<boolean>;
  updateSubscription(id: string, validUntil: string, lastValidatedAt: string): Promise<void>;
}
