import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return <SectionPlaceholder href="/clients" />;
}
