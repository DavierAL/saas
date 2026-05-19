import { useState } from "react";
import type { CSSProperties } from "react";
import type { Item } from "@saas-pos/domain";

import { useTenantId } from "../hooks/useTenantId";
import { useCatalog, type ItemFormData } from "../hooks/useCatalog";
import { CatalogHeader, CatalogTable, ItemModal, DeleteModal } from "../components/catalog";
import { ErrorBanner } from "../components/ErrorBanner";

export function CatalogPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const { items, loading, error, submitting, createItem, updateItem, deleteItem, clearError } = useCatalog(tenantId ?? null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  const handleCreate = async (formData: ItemFormData) => {
    await createItem(formData);
    setIsCreateModalOpen(false);
  };

  const handleUpdate = async (formData: ItemFormData) => {
    if (!editingItem) return;
    await updateItem(editingItem.id, formData);
    setEditingItem(null);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteItem(deletingItem.id);
    setDeletingItem(null);
  };

  if (tenantLoading || loading) {
    return (
      <div style={styles.loading}>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {error && (
        <ErrorBanner message={error} onDismiss={clearError} />
      )}

      <CatalogHeader items={items} onCreateClick={() => setIsCreateModalOpen(true)} />

      <CatalogTable items={items} onEdit={setEditingItem} onDelete={setDeletingItem} />

      <ItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        submitting={submitting}
      />

      <ItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSubmit={handleUpdate}
        editingItem={editingItem}
        submitting={submitting}
      />

      <DeleteModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        item={deletingItem}
        submitting={submitting}
      />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { padding: "32px 40px", maxWidth: 1100 },
  loading: { textAlign: "center", padding: "48px 0", color: "#555" },
};