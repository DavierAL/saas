import { useState, useEffect, useCallback } from "react";
import type { OrderAnalytics } from "@saas-pos/domain";
import { useCases } from "../lib/use-cases";
import { supabase } from "../lib/supabase";

export function useAnalytics(tenantId: string | null) {
  const [data, setData] = useState<OrderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean>(true);

  const loadAnalytics = useCallback(async () => {
    if (!tenantId) return;

    const { data: { session } } = await supabase.auth.getSession();
    setHasSession(!!session);

    setLoading(true);
    try {
      const res = await useCases.orders.getAnalytics(tenantId);
      setData(res);
      setError(null);
    } catch (err: any) {
      let msg = err.message || "Error al conectar con la base de datos";
      if (msg.includes("Failed to fetch")) {
        msg = "Error de Red: No se pudo contactar con Supabase. Verifica tu VITE_SUPABASE_URL en .env.local.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const totalRevenue = data?.daily_sales.reduce((sum, d) => sum + d.sales, 0) || 0;
  const avgDailySales = data?.daily_sales.length ? Math.round(totalRevenue / data.daily_sales.length) : 0;
  const topItemsTotalSold = data?.top_items.reduce((sum, item) => sum + item.sales, 0) || 0;

  const clearError = useCallback(() => setError(null), []);

  return {
    data,
    loading,
    error,
    hasSession,
    totalRevenue,
    avgDailySales,
    topItemsTotalSold,
    refetch: loadAnalytics,
    clearError,
  };
}