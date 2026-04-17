import type { Item } from '../entities/item';

export interface StockValidationResult {
  readonly valid: boolean;
  readonly insufficientItems: readonly { item_id: string; name: string; available: number; requested: number }[];
}

export interface CartLineForValidation {
  readonly item_id: string;
  readonly quantity: number;
}

export const validateStock = (
  cartLines: readonly CartLineForValidation[],
  items: readonly Item[],
): StockValidationResult => {
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const insufficient: { item_id: string; name: string; available: number; requested: number }[] = [];

  for (const line of cartLines) {
    const item = itemMap.get(line.item_id);
    if (!item) continue;
    // Services have no stock constraint
    if (item.type === 'service') continue;
    if (item.stock !== null && item.stock < line.quantity) {
      insufficient.push({
        item_id: line.item_id,
        name: item.name,
        available: item.stock,
        requested: line.quantity,
      });
    }
  }

  return {
    valid: insufficient.length === 0,
    insufficientItems: insufficient,
  };
};
