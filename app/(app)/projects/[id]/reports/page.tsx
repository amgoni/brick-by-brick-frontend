import type { Metadata } from "next";
import { ProjectReports } from "@/components/projects/project-reports";

export const metadata: Metadata = { title: "Daily site reports" };

export default function ProjectReportsPage() {
  return <ProjectReports />;
}
