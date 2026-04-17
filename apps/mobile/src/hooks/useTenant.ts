import { usePowerSyncQuery } from '@powersync/react-native';
import type { Tenant } from '@saas-pos/domain';

interface RawTenantRow {
  id: string;
  name: string;
  industry_type: string;
  modules_config: string;  // JSON string in SQLite
  valid_until: string;
  currency: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const useTenant = (tenantId: string): Tenant | null => {
  const data = usePowerSyncQuery<RawTenantRow>(
    `SELECT id, name, industry_type, modules_config, valid_until, currency,
            created_at, updated_at, deleted_at
     FROM tenants WHERE id = ?`,
    [tenantId],
  );

  const row = data?.[0];
  if (!row) return null;

  return {
    ...row,
    industry_type: row.industry_type as Tenant['industry_type'],
    modules_config: JSON.parse(row.modules_config) as Tenant['modules_config'],
  };
};
