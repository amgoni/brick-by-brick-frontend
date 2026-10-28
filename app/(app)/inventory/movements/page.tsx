import type { Metadata } from "next";
import { StockMovements } from "@/components/inventory/stock-movements";

export const metadata: Metadata = { title: "Stock movements" };

export default function StockMovementsPage() {
  return <StockMovements />;
}
