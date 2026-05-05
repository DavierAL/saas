import type { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseTableRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(tenantId: string) {
    const { data, error } = await this.client
      .from('tables')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('number', { ascending: true });

    if (error) throw error;
    return data;
  }

  async create(data: { number: number; name?: string }, tenantId: string) {
    const { data: inserted, error } = await this.client
      .from('tables')
      .insert({ ...data, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return inserted;
  }

  async update(id: string, data: { number?: number; name?: string; status?: 'free' | 'occupied' }, tenantId: string) {
    const { error } = await this.client
      .from('tables')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  async delete(id: string, tenantId: string) {
    const { error } = await this.client
      .from('tables')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  async findByStatus(tenantId: string, status: 'free' | 'occupied') {
    const { data, error } = await this.client
      .from('tables')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', status)
      .is('deleted_at', null);

    if (error) throw error;
    return data;
  }
}