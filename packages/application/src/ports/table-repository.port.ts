/**
 * Table Repository Port — Contract for table operations.
 */
import type { Tenant } from '@saas-pos/domain';

export type TableStatus = 'free' | 'occupied' | 'billing';

export interface RestaurantTable {
  readonly id: string;
  readonly tenant_id: string;
  readonly table_number: number;
  readonly status: TableStatus;
}

export interface ITableRepositoryPort {
  findAll(tenantId: string): Promise<RestaurantTable[]>;
  findById(id: string, tenantId: string): Promise<RestaurantTable | null>;
  findByNumber(tableNumber: number, tenantId: string): Promise<RestaurantTable | null>;
  insert(table: Omit<RestaurantTable, 'id'>): Promise<RestaurantTable>;
  updateStatus(id: string, status: TableStatus, tenantId: string): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
}