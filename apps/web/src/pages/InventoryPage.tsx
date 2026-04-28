import { useState, useMemo, useEffect } from "react";
import type { Item } from "@saas-pos/domain";
import { useCases } from "../lib/use-cases";
import { useTenantId } from "../hooks/useTenantId";

/**
 * InventoryPage: Stock management and low stock alerts
 * Shows: inventory levels, stock alerts, movement history
 * Uses shared use cases to fetch real data.
 */

interface InventoryItem {
  id: string;
  name: string;
  type: "product" | "service";
  currentStock: number;
  minimumStock: number;
  reorderQuantity: number;
  lastRestockDate: string;
  price: number; // in cents
}

interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  type: "in" | "out";
  timestamp: string;
  reason: string;
}

// Mock data for movements (since we don't have a movement repo yet in the factory)
const generateStockMovements = (): StockMovement[] => [
  {
    id: "1",
    itemId: "1",
    itemName: "Café Espresso Beans",
    quantity: 50,
    type: "in",
    timestamp: "2026-04-10 10:30",
    reason: "Restock - Supplier: Café Premium Imports",
  },
  {
    id: "2",
    itemId: "2",
    itemName: "Leche Fresca 1L",
    quantity: 8,
    type: "out",
    timestamp: "2026-04-14 15:45",
    reason: "Sales - Orders #453-460",
  },
  {
    id: "3",
    itemId: "3",
    itemName: "Pan Integral",
    quantity: 30,
    type: "in",
    timestamp: "2026-04-14 09:00",
    reason: "Restock - Supplier: Panadería Local",
  },
  {
    id: "4",
    itemId: "5",
    itemName: "Chocolate Premium",
    quantity: 2,
    type: "out",
    timestamp: "2026-04-15 12:20",
    reason: "Sales - Orders #489-490",
  },
  {
    id: "5",
    itemId: "1",
    itemName: "Café Espresso Beans",
    quantity: 15,
    type: "out",
    timestamp: "2026-04-15 18:30",
    reason: "Sales - Orders #491-505",
  },
];

// Colors
const DARK_BG = "#0f0f0f";
const SURFACE = "#1c1c1c";
const TEXT_PRIMARY = "#ededed";
const TEXT_SECONDARY = "#a0a0a0";
const ACCENT = "#3ECF8E";
const WARNING = "#f59e0b"; // Amber
const DANGER = "#ef4444";

export default function InventoryPage() {
  const { tenantId, loading: tenantLoading } = useTenantId();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const movements = useMemo(() => generateStockMovements(), []);
  const [filterType, setFilterType] = useState<"all" | "low" | "ok">("all");

  useEffect(() => {
    if (!tenantId) return;

    useCases.manageCatalog
      .findAll(tenantId)
      .then((data: Item[]) => {
        const mapped: InventoryItem[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          currentStock: item.stock ?? (item.type === "service" ? 9999 : 0),
          minimumStock: item.type === "service" ? 0 : 10, // Default for now
          reorderQuantity: item.type === "service" ? 0 : 20, // Default for now
          lastRestockDate: "N/A",
          price: item.price,
        }));
        setItems(mapped);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [tenantId]);

  // Calculate low stock items
  const lowStockItems = useMemo(
    () => items.filter((item) => item.currentStock <= item.minimumStock),
    [items],
  );

  // Filter items based on filter type
  const filteredItems = useMemo(() => {
    if (filterType === "low") return lowStockItems;
    if (filterType === "ok")
      return items.filter((item) => item.currentStock > item.minimumStock);
    return items;
  }, [items, lowStockItems, filterType]);

  // Calculate metrics
  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + item.currentStock * item.price, 0),
    [items],
  );
  const lowStockValue = useMemo(
    () =>
      lowStockItems.reduce(
        (sum, item) => sum + item.currentStock * item.price,
        0,
      ),
    [lowStockItems],
  );

  return (
    <div
      style={{
        backgroundColor: DARK_BG,
        color: TEXT_PRIMARY,
        padding: "2rem",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginTop: 0, fontSize: "2rem", fontWeight: 700 }}>
        📦 Inventory Management
      </h1>

      {tenantLoading || loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 0",
            color: TEXT_SECONDARY,
          }}
        >
          <p>Cargando inventario...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            <SummaryCard
              label="Total Stock Value"
              value={`S/ ${(totalValue / 100).toFixed(2)}`}
              accent={ACCENT}
            />
            <SummaryCard
              label="Low Stock Items"
              value={`${lowStockItems.length}`}
              accent={WARNING}
            />
            <SummaryCard
              label="At-Risk Value"
              value={`S/ ${(lowStockValue / 100).toFixed(2)}`}
              accent={DANGER}
            />
            <SummaryCard
              label="Total Items"
              value={`${items.filter((i) => i.type === "product").length}`}
              accent={ACCENT}
            />
          </div>

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div
              style={{
                marginBottom: "2rem",
                padding: "1rem",
                backgroundColor: "#5a3a1a",
                borderLeft: `3px solid ${DANGER}`,
                borderRadius: "4px",
              }}
            >
              <h3 style={{ margin: "0 0 0.5rem 0", color: WARNING }}>
                ⚠️ Low Stock Alert
              </h3>
              <p style={{ margin: 0, color: TEXT_SECONDARY, fontSize: "14px" }}>
                {lowStockItems.length} item
                {lowStockItems.length !== 1 ? "s" : ""} below minimum stock
                threshold. Reorder recommended.
              </p>
            </div>
          )}

          {/* Filter Tabs */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "2rem",
              borderBottom: "1px solid #333",
              paddingBottom: "1rem",
            }}
          >
            {(["all", "low", "ok"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                style={{
                  backgroundColor: filterType === tab ? ACCENT : "transparent",
                  color: filterType === tab ? DARK_BG : TEXT_SECONDARY,
                  border: `1px solid ${filterType === tab ? ACCENT : "#333"}`,
                  borderRadius: "4px",
                  padding: "0.5rem 1rem",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {tab === "all" && `All Items (${items.length})`}
                {tab === "low" && `Low Stock (${lowStockItems.length})`}
                {tab === "ok" &&
                  `OK (${items.filter((i) => i.currentStock > i.minimumStock).length})`}
              </button>
            ))}
          </div>

          {/* Inventory Table */}
          <div style={{ marginBottom: "2rem", overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid #333` }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "1rem",
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Item Name
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "1rem",
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "1rem",
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Current Stock
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "1rem",
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Min Level
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "1rem",
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "1rem",
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Unit Price
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "1rem",
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLowStock = item.currentStock <= item.minimumStock;
                  const statusColor =
                    item.type === "service"
                      ? ACCENT
                      : isLowStock
                        ? DANGER
                        : ACCENT;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #333",
                        backgroundColor:
                          isLowStock && item.type !== "service"
                            ? "rgba(239, 68, 68, 0.1)"
                            : "transparent",
                      }}
                    >
                      <td style={{ padding: "1rem", color: TEXT_PRIMARY }}>
                        {item.name}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: TEXT_SECONDARY,
                          fontSize: "12px",
                        }}
                      >
                        {item.type === "product" ? "📦 Product" : "💼 Service"}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          color: TEXT_PRIMARY,
                          fontWeight: 600,
                        }}
                      >
                        {item.type === "service" ? "∞" : item.currentStock}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          color: TEXT_SECONDARY,
                        }}
                      >
                        {item.type === "service" ? "—" : item.minimumStock}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.75rem",
                            borderRadius: "20px",
                            backgroundColor:
                              isLowStock && item.type !== "service"
                                ? "rgba(239, 68, 68, 0.2)"
                                : "rgba(62, 207, 142, 0.2)",
                            color: statusColor,
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {item.type === "service"
                            ? "N/A"
                            : isLowStock
                              ? "⚠️ Low"
                              : "✓ OK"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          color: TEXT_PRIMARY,
                        }}
                      >
                        S/ {(item.price / 100).toFixed(2)}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        {item.type !== "service" && isLowStock && (
                          <button
                            style={{
                              backgroundColor: ACCENT,
                              color: DARK_BG,
                              border: "none",
                              borderRadius: "4px",
                              padding: "0.5rem 1rem",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Reorder {item.reorderQuantity}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Stock Movement History */}
          <div style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: ACCENT,
                marginBottom: "1rem",
              }}
            >
              📜 Recent Stock Movements
            </h3>
            <div
              style={{
                backgroundColor: SURFACE,
                borderRadius: "8px",
                border: "1px solid #333",
                overflow: "hidden",
              }}
            >
              {movements.slice(0, 10).map((movement) => (
                <div
                  key={movement.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr 80px",
                    gap: "1rem",
                    padding: "1rem",
                    borderBottom: "1px solid #333",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", color: TEXT_SECONDARY }}>
                      {movement.timestamp}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>
                      {movement.itemName}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: TEXT_SECONDARY,
                        marginTop: "0.25rem",
                      }}
                    >
                      {movement.reason}
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      color: movement.type === "in" ? ACCENT : DANGER,
                      fontWeight: 600,
                      fontSize: "14px",
                    }}
                  >
                    {movement.type === "in" ? "+" : "-"} {movement.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reorder Recommendations */}
          {lowStockItems.length > 0 && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: SURFACE,
                borderLeft: `3px solid ${WARNING}`,
                borderRadius: "4px",
              }}
            >
              <h3 style={{ marginTop: 0, color: ACCENT }}>
                📋 Reorder Recommendations
              </h3>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.5rem",
                  color: TEXT_SECONDARY,
                  fontSize: "14px",
                }}
              >
                {lowStockItems.map((item) => (
                  <li key={item.id} style={{ marginBottom: "0.5rem" }}>
                    <strong style={{ color: TEXT_PRIMARY }}>{item.name}</strong>
                    : Order {item.reorderQuantity} units (current:{" "}
                    {item.currentStock}/{item.minimumStock})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Note */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              backgroundColor: SURFACE,
              borderLeft: `3px solid ${ACCENT}`,
              borderRadius: "4px",
              color: TEXT_SECONDARY,
              fontSize: "14px",
            }}
          >
            📌 In production, this page syncs real-time inventory data from
            PowerSync. Stock movements automatically update when orders are
            placed.
          </div>
        </>
      )}
    </div>
  );
}

// Helper Components
function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        backgroundColor: SURFACE,
        padding: "1.5rem",
        borderRadius: "8px",
        border: `1px solid #333`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          color: TEXT_SECONDARY,
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "24px", fontWeight: 700, color: accent }}>
        {value}
      </div>
    </div>
  );
}
