import type { Metadata } from "next";
import { ProjectSchedule } from "@/components/projects/project-schedule";

export const metadata: Metadata = { title: "Project schedule" };

export default function ProjectSchedulePage() {
  return <ProjectSchedule />;
}
