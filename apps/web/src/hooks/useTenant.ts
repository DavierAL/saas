import { useEffect, useState } from "react";
import type { Tenant } from "@saas-pos/domain";
import { useCases } from "../lib/use-cases";

export function useTenant(tenantId: string | null) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    async function fetchTenant(id: string) {
      try {
        setLoading(true);
        const data = await useCases.tenant.findById(id);
        setTenant(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Error al cargar el tenant");
      } finally {
        setLoading(false);
      }
    }

    fetchTenant(tenantId);
  }, [tenantId]);

  return { tenant, loading, error };
}
