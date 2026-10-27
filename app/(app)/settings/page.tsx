import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SectionPlaceholder href="/settings" />;
}
