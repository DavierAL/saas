import type { Item, ItemType } from '@saas-pos/domain';
import type { IItemRepositoryPort } from '../ports/item-repository.port';

export interface CreateItemInput {
  readonly name: string;
  readonly type: ItemType;
  readonly price: number;
  readonly stock?: number;
  readonly duration_minutes?: number | null;
  readonly sku?: string;
  readonly barcode?: string;
  readonly image_url?: string;
  readonly cost?: number;
  readonly brand?: string;
  readonly category?: string;
  readonly variant?: string;
  readonly weight_quantity?: string;
  readonly min_stock?: number;
  readonly description?: string;
  readonly has_expiry?: boolean;
  readonly expiry_date?: string;
  readonly expiry_comments?: string;
}

export interface UpdateItemInput {
  readonly name?: string;
  readonly price?: number;
  readonly stock?: number;
  readonly duration_minutes?: number | null;
  readonly sku?: string;
  readonly barcode?: string;
  readonly image_url?: string;
  readonly cost?: number;
  readonly brand?: string;
  readonly category?: string;
  readonly variant?: string;
  readonly weight_quantity?: string;
  readonly min_stock?: number;
  readonly description?: string;
  readonly has_expiry?: boolean;
  readonly expiry_date?: string;
  readonly expiry_comments?: string;
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
      duration_minutes: input.type === 'service' ? input.duration_minutes ?? null : null,
      sku:              input.sku,
      barcode:          input.barcode,
      image_url:        input.image_url,
      cost:             input.cost,
      brand:            input.brand,
      category:        input.category,
      variant:          input.variant,
      weight_quantity: input.weight_quantity,
      min_stock:       input.min_stock ?? 5,
      description:     input.description,
      has_expiry:      input.has_expiry ?? false,
      expiry_date:     input.expiry_date,
      expiry_comments: input.expiry_comments,
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
