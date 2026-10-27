import type { Metadata } from "next";
import { ProjectBudget } from "@/components/projects/project-budget";

export const metadata: Metadata = { title: "Project budget" };

export default function ProjectBudgetPage() {
  return <ProjectBudget />;
}
