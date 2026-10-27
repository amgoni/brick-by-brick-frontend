"use client";

import { ArrowRight, HardHat } from "lucide-react";
import Link from "next/link";
import { QueryBoundary } from "@/components/data/query-boundary";
import { ProjectLink } from "@/components/projects/project-link";
import { ProjectStatusBadge } from "@/components/projects/project-status";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListItem } from "@/components/ui/list";
import { Progress } from "@/components/ui/progress";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project } from "@/lib/api/types";
import { formatMoneyCompact, formatPercent } from "@/lib/format";
import { useProjects } from "@/lib/queries/projects";

export function ActiveProjectsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active projects</CardTitle>
        <CardDescription>Progress against schedule and budget</CardDescription>
        <CardAction>
          <Button asChild size="sm">
            <Link href="/projects">
              View all
              <ArrowRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <QueryBoundary fallback={<TableSkeleton rows={5} columns={4} />}>
        <ProjectsTable />
      </QueryBoundary>
    </Card>
  );
}

function ProjectsTable() {
  const { data: projects } = useProjects({ status: "active" });

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<HardHat />}
        title="No active projects"
        description="Projects show here once work starts on site."
      />
    );
  }

  // A table from the breakpoint up; on a phone, where four columns would
  // scroll sideways, the same facts as a stacked list. CSS picks which shows,
  // so the server and the browser render the same markup.
  return (
    <>
      <List className="md:hidden">
        {projects.map((project) => (
          <ListItem key={project.id} className="flex-col items-stretch gap-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <ProjectName project={project} />
                <ProjectPlace project={project} />
              </div>
              <ProjectStatusBadge project={project} />
            </div>
            <div className="flex items-center gap-4">
              <ProjectProgress project={project} className="flex-1" />
              <span className="shrink-0 text-sm text-ink-3">
                Budget <span className="font-medium text-ink">{budgetUsed(project)}</span> of{" "}
                {formatMoneyCompact(project.budget)}
              </span>
            </div>
          </ListItem>
        ))}
      </List>

      <Table className="min-w-160 max-md:hidden">
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead numeric>Budget used</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="w-[38%]">
                <ProjectName project={project} />
                <ProjectPlace project={project} />
              </TableCell>
              <TableCell className="w-[26%]">
                <ProjectProgress project={project} />
              </TableCell>
              <TableCell>
                <ProjectStatusBadge project={project} />
              </TableCell>
              <TableCell numeric>
                <div className="font-medium">{budgetUsed(project)}</div>
                <div className="text-sm text-ink-3">of {formatMoneyCompact(project.budget)}</div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

const budgetUsed = (project: Project) =>
  formatPercent(project.budget > 0 ? project.spent / project.budget : 0);

function ProjectName({ project }: { project: Project }) {
  return <ProjectLink project={project} />;
}

function ProjectPlace({ project }: { project: Project }) {
  return (
    <div className="text-sm text-ink-3">
      {[project.area, project.stage].filter(Boolean).join(" · ")}
    </div>
  );
}

function ProjectProgress({ project, className }: { project: Project; className?: string }) {
  return (
    <Progress
      value={Math.round(project.progress * 100)}
      showValue
      aria-label={`${project.name}: ${formatPercent(project.progress)} complete`}
      className={className}
    />
  );
}
