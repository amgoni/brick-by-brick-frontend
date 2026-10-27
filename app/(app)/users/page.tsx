import type { Metadata } from "next";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const metadata: Metadata = { title: "Users & roles" };

export default function UsersPage() {
  return <SectionPlaceholder href="/users" />;
}
