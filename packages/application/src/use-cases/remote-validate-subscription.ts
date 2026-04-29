import type { ITenantRepositoryPort } from '../ports/tenant-repository.port';
import type { IRemoteValidatorPort, RemoteValidationResult } from '../ports/remote-validator.port';

export interface RemoteValidateSubscriptionDeps {
  tenantRepo: ITenantRepositoryPort;
  remoteValidator: IRemoteValidatorPort;
}

/**
 * RemoteValidateSubscription use case.
 *
 * Calls the Supabase Edge Function to get canonical subscription data
 * and updates the local SQLite cache.
 * 
 * Returns the result so the UI can use it immediately if local sync is pending.
 */
export const remoteValidateSubscription = async (
  tenantId: string,
  deps: RemoteValidateSubscriptionDeps,
): Promise<RemoteValidationResult | null> => {
  try {
    const result = await deps.remoteValidator.validateSubscription(tenantId);
    
    // Update local SQLite with the values received from the server
    // Note: If the tenant record isn't in SQLite yet, this may affect 0 rows,
    // which is why we return the result to the caller.
    await deps.tenantRepo.updateSubscription(
      tenantId,
      result.valid_until,
      result.server_time,
    );
    
    console.log(`[RemoteValidation] Success for tenant ${tenantId}. Valid until: ${result.valid_until}`);
    return result;
  } catch (error: any) {
    console.warn(`[RemoteValidation] Failed: ${error.message}. Continuing with local data.`);
    // If it fails (offline or server error), we don't update anything.
    // The existing local paywall will still work against the old local cache.
    return null;
  }
};
