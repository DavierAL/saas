import type { OrderAnalytics } from "@saas-pos/domain";

interface CsvRow {
  [key: string]: string | number;
}

export function escapeCsvValue(value: string | number): string {
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function arrayToCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return "";
  const firstRow = rows[0]!;
  const headers = Object.keys(firstRow);
  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header] ?? "")).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

export function exportDailySalesToCsv(
  data: OrderAnalytics,
  tenantId: string
): void {
  const today = new Date().toISOString().split("T")[0];
  const rows: CsvRow[] = data.daily_sales.map((d) => ({
    fecha: d.date,
    ventas_centavos: d.sales,
    ventas_soles: (d.sales / 100).toFixed(2),
  }));

  const csv = arrayToCsv(rows);
  downloadCsv(csv, `daily_sales_${today}_${tenantId}.csv`);
}

export function exportTopItemsToCsv(
  data: OrderAnalytics,
  tenantId: string
): void {
  const today = new Date().toISOString().split("T")[0];
  const rows: CsvRow[] = data.top_items.map((item) => ({
    item: item.name,
    cantidad_vendida: item.sales,
  }));

  const csv = arrayToCsv(rows);
  downloadCsv(csv, `top_items_${today}_${tenantId}.csv`);
}

export function exportRevenueByCategoryToCsv(
  data: OrderAnalytics,
  tenantId: string
): void {
  const today = new Date().toISOString().split("T")[0];
  const rows: CsvRow[] = data.revenue_by_category.map((cat) => ({
    categoria: cat.name === "product" ? "Producto" : "Servicio",
    ingresos_centavos: cat.value,
    ingresos_soles: (cat.value / 100).toFixed(2),
  }));

  const csv = arrayToCsv(rows);
  downloadCsv(csv, `revenue_by_category_${today}_${tenantId}.csv`);
}

function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}