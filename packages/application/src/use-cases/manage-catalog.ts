import type { Item, ItemType } from '@saas-pos/domain';
import { generateId } from '@saas-pos/utils';
import type { IItemRepositoryPort } from '../ports/item-repository.port';

export interface CreateItemInput {
  readonly name: string;
  readonly type: ItemType;
  readonly price: number;  // integer cents
  readonly stock?: number; // null for services
}

export interface UpdateItemInput {
  readonly name?: string;
  readonly price?: number;
  readonly stock?: number;
}

/**
 * ManageCatalog use case — CRUD for catalog items.
 * Used by the web dashboard admin panel.
 */
export const createItem = async (
  input: CreateItemInput,
  tenantId: string,
  repo: IItemRepositoryPort,
): Promise<Item> => {
  if (input.name.trim().length === 0) {
    throw new Error('El nombre del producto no puede estar vacío.');
  }
  if (input.price < 0) {
    throw new Error('El precio no puede ser negativo.');
  }
  if (input.type === 'product' && (input.stock === undefined || input.stock < 0)) {
    throw new Error('Los productos físicos deben tener stock >= 0.');
  }

  return repo.insert(
    {
      tenant_id: tenantId,
      type:      input.type,
      name:      input.name.trim(),
      price:     input.price,
      stock:     input.type === 'service' ? null : (input.stock ?? 0),
    },
    tenantId,
  );
};

export const updateItem = async (
  id: string,
  input: UpdateItemInput,
  tenantId: string,
  repo: IItemRepositoryPort,
): Promise<void> => {
  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new Error('El nombre no puede estar vacío.');
  }
  if (input.price !== undefined && input.price < 0) {
    throw new Error('El precio no puede ser negativo.');
  }
  await repo.update(id, input, tenantId);
};

export const deleteItem = async (
  id: string,
  tenantId: string,
  repo: IItemRepositoryPort,
): Promise<void> => repo.softDelete(id, tenantId);
