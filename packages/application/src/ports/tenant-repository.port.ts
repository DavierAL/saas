import type { Tenant } from '@saas-pos/domain';

export interface ITenantRepositoryPort {
  findById(id: string): Promise<Tenant | null>;
  isSubscriptionActive(id: string): Promise<boolean>;
}
