import type { SupabaseClient } from '@supabase/supabase-js';
import type { Item, ItemType } from '@saas-pos/domain';
import type { IItemRepositoryPort } from '@saas-pos/application';

export class SupabaseItemRepository implements IItemRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(tenantId: string): Promise<Item[]> {
    const { data, error } = await this.client
      .from('items')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    return data as Item[];
  }

  async findById(id: string, tenantId: string): Promise<Item | null> {
    const { data, error } = await this.client
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Item | null;
  }

  async findByType(type: ItemType, tenantId: string): Promise<Item[]> {
    const { data, error } = await this.client
      .from('items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('type', type)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    return data as Item[];
  }

  async insert(
    data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
    tenantId: string,
  ): Promise<Item> {
    const { data: inserted, error } = await this.client
      .from('items')
      .insert({
        ...data,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) throw error;
    return inserted as Item;
  }

  async update(
    id: string,
    patch: Partial<Pick<Item, 'name' | 'price' | 'stock'>>,
    tenantId: string,
  ): Promise<void> {
    const { error } = await this.client
      .from('items')
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw error;
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const { error } = await this.client
      .from('items')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }

  async decrementStock(id: string, quantity: number, tenantId: string): Promise<void> {
    // In Postgres, we use an RPC to ensure atomic increment/decrement
    // because the REST API doesn't support "SET stock = stock - X" directly without RPC.
    const { error } = await this.client.rpc('decrement_item_stock', {
      item_id: id,
      t_id:    tenantId,
      qty:     quantity,
    });

    if (error) throw error;
  }
}
