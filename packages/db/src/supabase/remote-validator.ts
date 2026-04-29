import type { IRemoteValidatorPort, RemoteValidationResult } from '@saas-pos/application';
import type { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseRemoteValidator implements IRemoteValidatorPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async validateSubscription(tenantId: string): Promise<RemoteValidationResult> {
    // Try the edge function first (canonical source of truth)
    try {
      const { data, error } = await this.supabase.functions.invoke('validate-subscription');

      if (!error && data?.valid_until && data?.server_time) {
        return {
          valid_until: data.valid_until,
          server_time: data.server_time,
        };
      }

      if (error) {
        console.warn('[SupabaseRemoteValidator] Edge function error, falling back to direct DB:', error.message);
      }
    } catch (fnErr: any) {
      console.warn('[SupabaseRemoteValidator] Edge function threw, falling back to direct DB:', fnErr.message);
    }

    // Fallback: query Supabase directly using the user's session token
    // This works because the tenants table has RLS allowing users to read their own tenant
    const { data: tenant, error: dbErr } = await this.supabase
      .from('tenants')
      .select('valid_until')
      .eq('id', tenantId)
      .maybeSingle();

    if (dbErr) {
      throw new Error(`Remote validation DB fallback failed: ${dbErr.message}`);
    }

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found in remote database`);
    }

    console.log('[SupabaseRemoteValidator] DB fallback succeeded. valid_until:', tenant.valid_until);

    return {
      valid_until: tenant.valid_until,
      server_time: new Date().toISOString(),
    };
  }
}
