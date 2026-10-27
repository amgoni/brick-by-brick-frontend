import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <SectionPlaceholder href="/reports" />;
}
