/**
 * TenantRepository — SQLite implementation
 *
 * Provides access to the current tenant's configuration.
 * The subscription check is done locally (offline-first paywall):
 *   - App reads valid_until from local SQLite
 *   - Compares against device clock
 *   - No network required to enforce the paywall
 */
import type { PowerSyncDatabase } from '@powersync/react-native';
import type { Tenant } from '@saas-pos/domain';

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  isSubscriptionActive(id: string): Promise<boolean>;
}

export class SqliteTenantRepository implements ITenantRepository {
  constructor(private readonly db: PowerSyncDatabase) {}

  async findById(id: string): Promise<Tenant | null> {
    const row = await this.db.get<{
      id: string;
      name: string;
      industry_type: string;
      modules_config: string;
      valid_until: string;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    }>(
      `SELECT id, name, industry_type, modules_config,
              valid_until, created_at, updated_at, deleted_at
       FROM tenants WHERE id = ?`,
      [id],
    );

    if (!row) return null;

    return {
      ...row,
      industry_type: row.industry_type as Tenant['industry_type'],
      // modules_config is stored as JSON string in SQLite
      modules_config: JSON.parse(row.modules_config) as Tenant['modules_config'],
    };
  }

  /**
   * Offline paywall check.
   * Reads valid_until from SQLite and compares to device clock.
   * Returns false if tenant is not found (fail-safe: deny access).
   */
  async isSubscriptionActive(id: string): Promise<boolean> {
    const tenant = await this.findById(id);
    if (!tenant) return false;

    const validUntil = new Date(tenant.valid_until);
    return validUntil > new Date();
  }
}
