export type OrderStatus = 'pending' | 'paid' | 'cancelled';

export interface Order {
  readonly id: string;
  readonly tenant_id: string;
  readonly user_id: string;
  readonly status: OrderStatus;
  readonly total_amount: number; // integer cents
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
}
