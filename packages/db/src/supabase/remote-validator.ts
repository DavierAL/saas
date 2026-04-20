import type { IRemoteValidatorPort, RemoteValidationResult } from '@saas-pos/application';
import type { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseRemoteValidator implements IRemoteValidatorPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async validateSubscription(_tenantId: string): Promise<RemoteValidationResult> {
    const { data, error } = await this.supabase.functions.invoke('validate-subscription');

    if (error) {
      throw new Error(`Remote validation failed: ${error.message}`);
    }

    if (!data || !data.valid_until || !data.server_time) {
      throw new Error('Invalid response from remote validation');
    }

    return {
      valid_until: data.valid_until,
      server_time: data.server_time,
    };
  }
}
