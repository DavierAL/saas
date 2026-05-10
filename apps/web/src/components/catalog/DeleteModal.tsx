import type { Item } from "@saas-pos/domain";
import { Modal } from "@saas-pos/ui";

type DeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  item: Item | null;
  submitting: boolean;
};

export function DeleteModal({ isOpen, onClose, onConfirm, item, submitting }: DeleteModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar Item">
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        ¿Estás seguro de eliminar <strong>"{item?.name}"</strong>?
      </p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={s.cancelBtn}>
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          style={{ ...s.submitBtn, backgroundColor: "var(--error-color)", opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </Modal>
  );
}

const s = {
  cancelBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "4px",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "0.5rem 1rem",
    color: "#0f0f0f",
    border: "none",
    borderRadius: "4px",
    fontWeight: 600,
    cursor: "pointer",
  },
};