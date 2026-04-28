import type { IRemoteValidatorPort, RemoteValidationResult } from '@saas-pos/application';
import type { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseRemoteValidator implements IRemoteValidatorPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async validateSubscription(_tenantId: string): Promise<RemoteValidationResult> {
    const { data, error } = await this.supabase.functions.invoke('validate-subscription');

    if (error) {
      console.warn('[SupabaseRemoteValidator] Raw error:', error);
      // In Supabase SDK, the body of a 400 response is often in error.context
      let message = error.message;
      if ((error as any).context) {
        try {
          const context = (error as any).context;
          message = context.error || context.message || JSON.stringify(context);
        } catch {
          message = error.message;
        }
      }
      throw new Error(`Remote validation failed: ${message}`);
    }

    if (!data || !data.valid_until || !data.server_time) {
      if (data?.error) {
        throw new Error(`Remote validation error: ${data.error}`);
      }
      throw new Error('Invalid response from remote validation');
    }

    return {
      valid_until: data.valid_until,
      server_time: data.server_time,
    };
  }
}
