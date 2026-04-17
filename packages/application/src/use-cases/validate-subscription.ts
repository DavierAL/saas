import { getSubscriptionStatus } from '@saas-pos/domain';
import type { SubscriptionStatus } from '@saas-pos/domain';
import type { ITenantRepositoryPort } from '../ports/tenant-repository.port';

export interface ValidateSubscriptionResult {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly subscription: SubscriptionStatus | null;
}

/**
 * ValidateSubscription use case.
 *
 * Runs LOCALLY against SQLite — no network required.
 * This is the offline paywall: if valid_until has passed,
 * the cashier CANNOT create new orders, but existing data
 * is preserved and readable.
 */
export const validateSubscription = async (
  tenantId: string,
  repo: ITenantRepositoryPort,
): Promise<ValidateSubscriptionResult> => {
  const tenant = await repo.findById(tenantId);

  if (!tenant) {
    return {
      allowed: false,
      reason: 'Tenant no encontrado. Contacta soporte.',
      subscription: null,
    };
  }

  const subscription = getSubscriptionStatus(tenant);

  if (!subscription.isActive) {
    return {
      allowed: false,
      reason: `Suscripción vencida. Renueva para continuar cobrando.`,
      subscription,
    };
  }

  return { allowed: true, subscription };
};
