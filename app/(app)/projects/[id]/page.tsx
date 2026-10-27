import type { Metadata } from "next";
import { ProjectOverview } from "@/components/projects/project-overview";

// Static: the project's name is only known in the browser (see the layout).
export const metadata: Metadata = { title: "Project overview" };

export default function ProjectOverviewPage() {
  return <ProjectOverview />;
}
