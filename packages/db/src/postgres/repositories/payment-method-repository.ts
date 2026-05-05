import type { SupabaseClient } from '@supabase/supabase-js';

export class SupabasePaymentMethodRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(tenantId: string) {
    const { data, error } = await this.client
      .from('payment_methods')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async create(data: { name: string; type: string; is_active?: boolean; config?: object }, tenantId: string) {
    const { data: inserted, error } = await this.client
      .from('payment_methods')
      .insert({ ...data, is_active: data.is_active ?? true, config: data.config ?? {}, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return inserted;
  }

  async update(id: string, data: { name?: string; type?: string; is_active?: boolean; config?: object }, tenantId: string) {
    const { error } = await this.client
      .from('payment_methods')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  async delete(id: string, tenantId: string) {
    const { error } = await this.client
      .from('payment_methods')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }
}