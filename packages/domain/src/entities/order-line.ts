export interface OrderLine {
  readonly id: string;
  readonly order_id: string;
  readonly item_id: string;
  readonly quantity: number;
  readonly unit_price: number; // snapshot in integer cents
  readonly subtotal: number;   // quantity * unit_price in integer cents
  readonly tenant_id: string;
}
