import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tenant } from '@saas-pos/domain';
import type { ITenantRepositoryPort } from '@saas-pos/application';
import { isTenantSubscriptionActive } from '@saas-pos/domain';

export class SupabaseTenantRepository implements ITenantRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Tenant | null> {
    const { data, error } = await this.client
      .from('tenants')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    // In Postgres/Supabase, modules_config is likely already a JSON object (jsonb),
    // but the domain expects ModulesConfig. If it's a string, we parse it.
    let modulesConfig = data.modules_config;
    if (typeof modulesConfig === 'string') {
      try {
        modulesConfig = JSON.parse(modulesConfig);
      } catch {
        modulesConfig = {
          has_inventory: false,
          has_tables:    false,
          has_appointments: false,
        };
      }
    }

    return {
      ...data,
      modules_config: modulesConfig as Tenant['modules_config'],
      industry_type:  data.industry_type as Tenant['industry_type'],
    } as Tenant;
  }

  async isSubscriptionActive(id: string): Promise<boolean> {
    const tenant = await this.findById(id);
    if (!tenant) return false;
    return isTenantSubscriptionActive(tenant);
  }

  async updateSubscription(id: string, validUntil: string, lastValidatedAt: string): Promise<void> {
    const { error } = await this.client
      .from('tenants')
      .update({
        valid_until: validUntil,
        last_remote_validation_at: lastValidatedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }
}
