import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const metadata: Metadata = { title: "Properties" };

export default function PropertiesPage() {
  return <SectionPlaceholder href="/properties" />;
}
