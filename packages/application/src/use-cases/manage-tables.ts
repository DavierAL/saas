/**
 * Manage Tables — Use case for restaurant table operations.
 */
import type { ITableRepositoryPort, RestaurantTable, TableStatus } from '../ports/table-repository.port';

export const listTables = async (
  tenantId: string,
  tableRepo: ITableRepositoryPort
): Promise<RestaurantTable[]> => {
  return tableRepo.findAll(tenantId);
};

export const getTableById = async (
  id: string,
  tenantId: string,
  tableRepo: ITableRepositoryPort
): Promise<RestaurantTable | null> => {
  return tableRepo.findById(id, tenantId);
};

export const createTable = async (
  tableNumber: number,
  tenantId: string,
  tableRepo: ITableRepositoryPort
): Promise<RestaurantTable> => {
  // Check if table number already exists
  const existing = await tableRepo.findByNumber(tableNumber, tenantId);
  if (existing) {
    throw new Error('Ya existe una mesa con ese número');
  }
  
  return tableRepo.insert({
    tenant_id: tenantId,
    table_number: tableNumber,
    status: 'free',
  });
};

export const updateTableStatus = async (
  id: string,
  status: TableStatus,
  tenantId: string,
  tableRepo: ITableRepositoryPort
): Promise<void> => {
  return tableRepo.updateStatus(id, status, tenantId);
};

export const deleteTable = async (
  id: string,
  tenantId: string,
  tableRepo: ITableRepositoryPort
): Promise<void> => {
  return tableRepo.softDelete(id, tenantId);
};