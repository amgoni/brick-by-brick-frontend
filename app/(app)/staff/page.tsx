import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const metadata: Metadata = { title: "Staff" };

export default function StaffPage() {
  return <SectionPlaceholder href="/staff" />;
}
