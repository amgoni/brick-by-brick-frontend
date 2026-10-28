import type { Metadata } from "next";
import { StockOnHand } from "@/components/inventory/stock-on-hand";

export const metadata: Metadata = { title: "Inventory" };

export default function InventoryPage() {
  return <StockOnHand />;
}
