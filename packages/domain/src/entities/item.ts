export type ItemType = 'product' | 'service';

export interface Item {
  readonly id: string;
  readonly tenant_id: string;
  readonly type: ItemType;
  readonly name: string;
  readonly price: number; // stored as integer cents to avoid floating point
  readonly stock: number | null; // null for services
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
}
