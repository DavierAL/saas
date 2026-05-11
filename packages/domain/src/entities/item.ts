export type ItemType = 'product' | 'service';

export interface Item {
  readonly id: string;
  readonly tenant_id: string;
  readonly type: ItemType;
  readonly name: string;
  readonly price: number;
  readonly stock: number | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
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
  readonly duration_minutes?: number | null;
}
