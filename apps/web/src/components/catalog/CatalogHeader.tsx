import type { Item } from "@saas-pos/domain";

type CatalogHeaderProps = {
  items: Item[];
  onCreateClick: () => void;
};

export function CatalogHeader({ items, onCreateClick }: CatalogHeaderProps) {
  const productCount = items.filter((i) => i.type === "product").length;
  const serviceCount = items.filter((i) => i.type === "service").length;

  return (
    <div style={s.header}>
      <div>
        <h1 style={s.title}>Catálogo</h1>
        <p style={s.subtitle}>
          {items.length} items · {productCount} productos · {serviceCount} servicios
        </p>
      </div>
      <button style={s.btn} onClick={onCreateClick}>
        + Nuevo item
      </button>
    </div>
  );
}

const s = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: "var(--text-muted)",
    marginTop: 4,
    margin: 0,
  },
  btn: {
    backgroundColor: "var(--accent-color)",
    color: "#0f0f0f",
    border: "none",
    borderRadius: 6,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};