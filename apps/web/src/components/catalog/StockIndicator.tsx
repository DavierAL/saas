type StockIndicatorProps = {
  stock: number | null;
};

export function StockIndicator({ stock }: StockIndicatorProps) {
  if (stock === null) {
    return <span style={{ color: "#555", fontSize: 13 }}>—</span>;
  }
  const color = stock === 0 ? "#EF4444" : stock <= 5 ? "#F59E0B" : "#9b9b9b";
  return (
    <span style={{ color, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
      {stock}
    </span>
  );
}