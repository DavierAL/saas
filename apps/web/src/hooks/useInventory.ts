import { useState, useEffect, useCallback } from "react";
import type { Item } from "@saas-pos/domain";
import { useCases } from "../lib/use-cases";

export function useInventory(tenantId: string | null) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await useCases.manageCatalog.findAll(tenantId);
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const lowStockItems = items.filter(i => i.stock !== null && (i.min_stock ? i.stock <= i.min_stock : i.stock <= 5));

  const clearError = useCallback(() => setError(null), []);

  return { items, lowStockItems, loading, error, refetch: loadItems, clearError };
}