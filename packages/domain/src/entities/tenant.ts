export type IndustryType = 'restaurant' | 'barbershop' | 'retail';

export interface ModulesConfig {
  readonly has_inventory: boolean;
  readonly has_tables: boolean;
  readonly has_appointments: boolean;
}

export interface Tenant {
  readonly id: string;
  readonly name: string;
  readonly industry_type: IndustryType;
  readonly modules_config: ModulesConfig;
  readonly valid_until: string; // ISO date string - paywall control
  readonly last_remote_validation_at?: string; // [DOM-012] Tracking for periodic validation
  readonly currency: string;    // [DOM-008] Tenant-specific currency code
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
}

export const createTenant = (
  params: Omit<Tenant, 'created_at' | 'updated_at' | 'deleted_at' | 'currency'> & { currency?: string }
): Tenant => ({
  ...params,
  currency: params.currency || 'PEN', // Backwards compatibility / default
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
});

export const isTenantSubscriptionActive = (tenant: Tenant): boolean => {
  const now = new Date();
  const validUntil = new Date(tenant.valid_until);
  return validUntil > now;
};
