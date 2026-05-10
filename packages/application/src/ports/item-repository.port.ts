import type { Item, ItemType } from '@saas-pos/domain';

export interface IItemRepositoryPort {
  findAll(tenantId: string): Promise<Item[]>;
  findById(id: string, tenantId: string): Promise<Item | null>;
  findByType(type: ItemType, tenantId: string): Promise<Item[]>;
  insert(data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>, tenantId: string): Promise<Item>;
  update(id: string, patch: Partial<Omit<Item, 'id' | 'tenant_id' | 'type' | 'created_at' | 'updated_at' | 'deleted_at'>>, tenantId: string): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
  decrementStock(id: string, quantity: number, tenantId: string): Promise<void>;
}
