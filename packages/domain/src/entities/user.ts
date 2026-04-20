export type UserRole = 'admin' | 'cashier' | 'waiter';

export interface User {
  readonly id: string;
  readonly tenant_id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
}
