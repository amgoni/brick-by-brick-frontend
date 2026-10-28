import type { Metadata } from "next";
import { PurchaseOrders } from "@/components/inventory/purchase-orders";

export const metadata: Metadata = { title: "Purchase orders" };

export default function PurchaseOrdersPage() {
  return <PurchaseOrders />;
}
