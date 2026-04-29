import { useState, useEffect } from 'react';
import { getDatabase } from '../lib/powersync/database';

export interface Tenant {
  id: string;
  name: string;
  currency: string;
  industry_type: string;
}

export function useTenant(tenantId: string | null) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const db = getDatabase();

    // Use getOptional() instead of get() — get() throws "Result set is empty"
    // when no row exists (e.g., during initial sync). getOptional() returns null.
    db.getOptional<Tenant>('SELECT * FROM tenants WHERE id = ?', [tenantId])
      .then((res) => {
        setTenant(res);
        setIsLoading(false);
      })
      .catch(err => {
        // Only log if it's a real DB error, not just a missing row during sync
        if (!err.message.includes('Result set is empty')) {
          console.warn('[useTenant] DB error fetching tenant:', err.message);
        }
        setIsLoading(false);
      });

    // Watch for live changes (fires when PowerSync syncs the tenant row)
    const unsubscribe = db.watch('SELECT * FROM tenants WHERE id = ?', [tenantId], {
      onResult: (result) => {
        const row = result.rows?.[0] ?? null;
        setTenant(row);
        setIsLoading(false);
        if (row) {
          console.log(`[useTenant] Tenant synced locally: ${row.name}`);
        }
      }
    });

    return unsubscribe;
  }, [tenantId]);

  return { tenant, isLoading };
}
