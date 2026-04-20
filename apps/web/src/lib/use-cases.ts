import { supabase } from './supabase';
import {
  SupabaseItemRepository,
  SupabaseOrderRepository,
  SupabaseTenantRepository,
} from '@saas-pos/db';
import {
  checkout, createItem, updateItem, deleteItem,
} from '@saas-pos/application';
import type { CreateItemInput, UpdateItemInput, CheckoutInput } from '@saas-pos/application';

const itemRepo = new SupabaseItemRepository(supabase);
const orderRepo = new SupabaseOrderRepository(supabase);
const tenantRepo = new SupabaseTenantRepository(supabase);

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
  },
};