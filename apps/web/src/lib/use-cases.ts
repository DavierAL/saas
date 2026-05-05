import { supabase } from './supabase';
import {
  SupabaseItemRepository,
  SupabaseOrderRepository,
  SupabaseTenantRepository,
  SupabaseUserRepository,
} from '@saas-pos/db';
import {
  checkout, createItem, updateItem, deleteItem,
  listUsers, getUserById, createUser, updateUserRole, deleteUser,
  updateOrderStatus,
} from '@saas-pos/application';
import type { CreateItemInput, UpdateItemInput, CheckoutInput } from '@saas-pos/application';
import type { UserRole } from '@saas-pos/domain';

const itemRepo = new SupabaseItemRepository(supabase);
const orderRepo = new SupabaseOrderRepository(supabase);
const tenantRepo = new SupabaseTenantRepository(supabase);
const userRepo = new SupabaseUserRepository(supabase);

export const useCases = {
  manageCatalog: {
    createItem: (input: CreateItemInput, tenantId: string) =>
      createItem(input, tenantId, itemRepo),
    updateItem: (id: string, input: UpdateItemInput, tenantId: string) =>
      updateItem(id, input, tenantId, itemRepo),
    deleteItem: (id: string, tenantId: string) =>
      deleteItem(id, tenantId, itemRepo),
    findAll: (tenantId: string) => itemRepo.findAll(tenantId),
    findById: (id: string, tenantId: string) => itemRepo.findById(id, tenantId),
    findLowStock: (tenantId: string, threshold?: number) =>
      itemRepo.findLowStock(tenantId, threshold),
    incrementStock: (id: string, quantity: number, tenantId: string) =>
      itemRepo.incrementStock(id, quantity, tenantId),
  },
  checkout: (input: CheckoutInput) =>
    checkout(input, { itemRepo, orderRepo, tenantRepo }),
  orders: {
    findByTenant: (tenantId: string, cursor?: string, limit?: number) =>
      orderRepo.findByTenant(tenantId, cursor, limit),
    findById: (id: string, tenantId: string) =>
      orderRepo.findById(id, tenantId),
    getLines: (orderId: string, tenantId: string) =>
      orderRepo.getLinesByOrderId(orderId, tenantId),
    getAnalytics: (tenantId: string, days?: number) =>
      orderRepo.getAnalytics(tenantId, days),
    getDailyClosing: (tenantId: string, date: string) =>
      orderRepo.getDailyClosing(tenantId, date),
    updateStatus: (id: string, status: any, tenantId: string) =>
      updateOrderStatus({ id, status, tenant_id: tenantId } as any, status, orderRepo),
  },
  users: {
    findAll: (tenantId: string) => listUsers(tenantId, userRepo),
    findById: (id: string, tenantId: string) => getUserById(id, tenantId, userRepo),
    createUser: (input: { email: string; password: string; role: UserRole }, tenantId: string, deps: { hashPassword: (password: string) => Promise<string> }) =>
      createUser(input, tenantId, userRepo, deps),
    updateUserRole: (id: string, input: { role: UserRole }, tenantId: string) =>
      updateUserRole(id, input, tenantId, userRepo),
    deleteUser: (id: string, tenantId: string) =>
      deleteUser(id, tenantId, userRepo),
  },
  tenant: {
    findById: (id: string) => tenantRepo.findById(id),
  },
};