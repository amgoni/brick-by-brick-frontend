import type { Metadata } from "next";
import { ProjectTeam } from "@/components/projects/project-team";

export const metadata: Metadata = { title: "Project team" };

export default function ProjectTeamPage() {
  return <ProjectTeam />;
}
