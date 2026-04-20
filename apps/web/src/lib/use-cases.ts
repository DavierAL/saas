/**
 * Factory for shared use cases in the Web app.
 * Connects domain use cases with Postgres (Supabase) implementations.
 */
import {
  SupabaseItemRepository,
  SupabaseOrderRepository,
  SupabaseTenantRepository,
  supabase
} from '@saas-pos/db';

import {
  checkout,
  createItem,
  updateItem,
  deleteItem
} from '@saas-pos/application';

import type { CreateItemInput, UpdateItemInput } from '@saas-pos/application';
import type { CheckoutInput } from '@saas-pos/application';

// Singleton repositories using the shared supabase client
const itemRepo = new SupabaseItemRepository(supabase);
const orderRepo = new SupabaseOrderRepository(supabase);
const tenantRepo = new SupabaseTenantRepository(supabase);

export const useCases = {
  /**
   * Catalog management use cases
   */
  manageCatalog: {
    createItem: (input: CreateItemInput, tenantId: string) => 
      createItem(input, tenantId, itemRepo),
    
    updateItem: (id: string, input: UpdateItemInput, tenantId: string) => 
      updateItem(id, input, tenantId, itemRepo),
    
    deleteItem: (id: string, tenantId: string) => 
      deleteItem(id, tenantId, itemRepo),
    
    // Repository methods can be exposed directly if they don't involve business logic
    findAll: (tenantId: string) => itemRepo.findAll(tenantId),
    findById: (id: string, tenantId: string) => itemRepo.findById(id, tenantId),
  },

  /**
   * Order and Checkout use cases
   */
  checkout: (input: CheckoutInput) => 
    checkout(input, { itemRepo, orderRepo, tenantRepo }),

  orders: {
    findByTenant: (tenantId: string, cursor?: string, limit?: number) => 
      orderRepo.findByTenant(tenantId, cursor, limit),
    
    findById: (id: string, tenantId: string) => 
      orderRepo.findById(id, tenantId),
    
    getLines: (orderId: string, tenantId: string) => 
      orderRepo.getLinesByOrderId(orderId, tenantId),
  }
};
