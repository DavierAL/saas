import { useState, useEffect, useCallback } from "react";
import type { Item, ItemType } from "@saas-pos/domain";
import { useCases } from "../lib/use-cases";

export type ItemFormData = {
  name: string;
  type: ItemType;
  price: string;
  stock: string;
  sku: string;
  barcode: string;
  image_url: string;
  cost: string;
  brand: string;
  category: string;
  variant: string;
  weight_quantity: string;
  min_stock: string;
  description: string;
  has_expiry: boolean;
  expiry_date: string;
  expiry_comments: string;
};

export function useCatalog(tenantId: string | null) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await useCases.manageCatalog.findAll(tenantId);
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar el catálogo");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createItem = async (formData: ItemFormData) => {
    if (!tenantId) return;
    setSubmitting(true);
    try {
      const priceCents = Math.round(parseFloat(formData.price) * 100);
      const costCents = formData.cost ? Math.round(parseFloat(formData.cost) * 100) : undefined;
      await useCases.manageCatalog.createItem(
        {
          name: formData.name,
          type: formData.type,
          price: priceCents,
          stock: formData.type === "service" ? undefined : parseInt(formData.stock, 10),
          sku: formData.sku || undefined,
          barcode: formData.barcode || undefined,
          image_url: formData.image_url || undefined,
          cost: costCents,
          brand: formData.brand || undefined,
          category: formData.category || undefined,
          variant: formData.variant || undefined,
          weight_quantity: formData.weight_quantity || undefined,
          min_stock: formData.min_stock ? parseInt(formData.min_stock, 10) : undefined,
          description: formData.description || undefined,
          has_expiry: formData.has_expiry || false,
          expiry_date: formData.expiry_date || undefined,
          expiry_comments: formData.expiry_comments || undefined,
        },
        tenantId
      );
      await loadItems();
    } catch (err: any) {
      setError(err.message || "Error al crear item");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = async (id: string, formData: ItemFormData) => {
    if (!tenantId) return;
    setSubmitting(true);
    try {
      const priceCents = Math.round(parseFloat(formData.price) * 100);
      const costCents = formData.cost ? Math.round(parseFloat(formData.cost) * 100) : undefined;
      await useCases.manageCatalog.updateItem(
        id,
        {
          name: formData.name,
          price: priceCents,
          stock: formData.type === "service" ? undefined : parseInt(formData.stock, 10),
          sku: formData.sku || undefined,
          barcode: formData.barcode || undefined,
          image_url: formData.image_url || undefined,
          cost: costCents,
          brand: formData.brand || undefined,
          category: formData.category || undefined,
          variant: formData.variant || undefined,
          weight_quantity: formData.weight_quantity || undefined,
          min_stock: formData.min_stock ? parseInt(formData.min_stock, 10) : undefined,
          description: formData.description || undefined,
          has_expiry: formData.has_expiry || false,
          expiry_date: formData.expiry_date || undefined,
          expiry_comments: formData.expiry_comments || undefined,
        },
        tenantId
      );
      await loadItems();
    } catch (err: any) {
      setError(err.message || "Error al actualizar item");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!tenantId) return;
    setSubmitting(true);
    try {
      await useCases.manageCatalog.deleteItem(id, tenantId);
      await loadItems();
    } catch (err: any) {
      setError(err.message || "Error al eliminar item");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    items,
    loading,
    error,
    submitting,
    createItem,
    updateItem,
    deleteItem,
    refetch: loadItems,
    clearError,
  };
}

export function getEmptyFormData(): ItemFormData {
  return {
    name: "", type: "product", price: "", stock: "0",
    sku: "", barcode: "", image_url: "", cost: "",
    brand: "", category: "", variant: "", weight_quantity: "",
    min_stock: "5", description: "",
    has_expiry: false, expiry_date: "", expiry_comments: "",
  };
}

export function itemToFormData(item: Item): ItemFormData {
  return {
    name: item.name,
    type: item.type,
    price: (item.price / 100).toString(),
    stock: item.stock?.toString() ?? "0",
    sku: item.sku ?? "",
    barcode: item.barcode ?? "",
    image_url: item.image_url ?? "",
    cost: item.cost ? (item.cost / 100).toString() : "",
    brand: item.brand ?? "",
    category: item.category ?? "",
    variant: item.variant ?? "",
    weight_quantity: item.weight_quantity ?? "",
    min_stock: item.min_stock?.toString() ?? "5",
    description: item.description ?? "",
    has_expiry: item.has_expiry ?? false,
    expiry_date: item.expiry_date ?? "",
    expiry_comments: item.expiry_comments ?? "",
  };
}