import { getSubscriptionStatus } from '@saas-pos/domain';
import type { SubscriptionStatus } from '@saas-pos/domain';
import type { ITenantRepositoryPort } from '../ports/tenant-repository.port';

export interface ValidateSubscriptionResult {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly warning?: string;
  readonly subscription: SubscriptionStatus | null;
}

/**
 * ValidateSubscription use case.
 *
 * Runs LOCALLY against SQLite — no network required.
 * This is the offline paywall: if valid_until has passed,
 * the cashier CANNOT create new orders, but existing data
 * is preserved and readable.
 * 
 * [NEW] Also checks for periodic remote validation. If the
 * device has been offline for > 7 days, shows a warning.
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

  // ── Periodic Remote Validation Check ────────────────────────
  let warning: string | undefined;
  
  if (tenant.last_remote_validation_at) {
    const lastValidated = new Date(tenant.last_remote_validation_at);
    const now = new Date();
    const diffMs = now.getTime() - lastValidated.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      warning = `Offline por ${Math.floor(diffDays)} días. Conéctate a internet para validar tu suscripción.`;
    }
  } else {
    // If it has NEVER been validated remotely (new install), we might want to warn too,
    // but usually the first login would have triggered it.
    warning = 'Pendiente de validación remota inicial.';
  }

  return { allowed: true, subscription, warning };
};
