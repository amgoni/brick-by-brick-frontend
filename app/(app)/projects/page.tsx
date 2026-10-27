import type { Metadata } from "next";
import { ProjectsBrowser } from "@/components/projects/projects-browser";

export const metadata: Metadata = { title: "Projects & sites" };

export default function ProjectsPage() {
  return <ProjectsBrowser />;
}
