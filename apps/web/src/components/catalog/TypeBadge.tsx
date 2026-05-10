import type { Item } from "@saas-pos/domain";

type TypeBadgeProps = {
  type: Item["type"];
};

export function TypeBadge({ type }: TypeBadgeProps) {
  const isProduct = type === "product";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: isProduct ? "#0d2b1e" : "#14143b",
        color: isProduct ? "#3ECF8E" : "#818CF8",
        letterSpacing: "0.5px",
      }}
    >
      {isProduct ? "PRODUCTO" : "SERVICIO"}
    </span>
  );
}