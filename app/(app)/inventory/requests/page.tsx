import type { Metadata } from "next";
import { MaterialRequests } from "@/components/inventory/material-requests";

export const metadata: Metadata = { title: "Material requests" };

export default function MaterialRequestsPage() {
  return <MaterialRequests />;
}
