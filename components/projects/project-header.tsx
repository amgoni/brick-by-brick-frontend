"use client";

import { CalendarRange, Folder, MapPin, Package, Plus, SearchX } from "lucide-react";
import Link from "next/link";
import { describeError, QueryBoundary } from "@/components/data/query-boundary";
import { useProjectId } from "@/components/projects/project-link";
import {
  crewLabel,
  describeProjectKind,
  ProjectStatusBadge,
} from "@/components/projects/project-status";
import { Avatar } from "@/components/ui/avatar";
import { Tag } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Stat, StatStrip } from "@/components/ui/stat";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import type { ProjectDetail } from "@/lib/api/types";
import {
  daysBetween,
  formatCount,
  formatDate,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
  formatRelativeDay,
} from "@/lib/format";
import { useProject } from "@/lib/queries/projects";
import { capitalize } from "@/lib/utils";

const PROJECTS_CRUMB = { label: "Projects & sites", href: "/projects" };

/**
 * The top of every tab of a project's page: where it is, when, who runs it,
 * and the actions that apply whichever tab is open.
 */
export function ProjectHeader() {
  return (
    <QueryBoundary
      fallback={
        <PageHeader
          breadcrumb={
            <Breadcrumb items={[PROJECTS_CRUMB, { label: <Skeleton className="h-4 w-40" /> }]} />
          }
          title={<Skeleton className="my-0.5 h-6.5 w-80 max-w-full" />}
          meta={<Skeleton className="h-5 w-120 max-w-full" />}
          actions={<ProjectActions />}
        />
      }
      errorFallback={({ error, retry }) =>
        error instanceof ApiError && error.status === 404 ? (
          <ProjectMissing />
        ) : (
          <>
            <PageHeader
              breadcrumb={<Breadcrumb items={[PROJECTS_CRUMB, { label: "Project" }]} />}
              title="Project"
              actions={<ProjectActions />}
            />
            <Card>
              <ErrorState description={describeError(error)} onRetry={retry} />
            </Card>
          </>
        )
      }
    >
      <HeaderContent />
    </QueryBoundary>
  );
}

function HeaderContent() {
  const { data: project } = useProject(useProjectId());
  return (
    <PageHeader
      breadcrumb={<Breadcrumb items={[PROJECTS_CRUMB, { label: project.name }]} />}
      title={project.name}
      status={
        <>
          <ProjectStatusBadge project={project} />
          <Tag>{describeProjectKind(project)}</Tag>
        </>
      }
      meta={
        <>
          <span className="flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="text-ink-3" />
            {project.address}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarRange aria-hidden="true" className="text-ink-3" />
            <span>
              <time dateTime={project.startDate}>{formatDate(project.startDate)}</time> –{" "}
              <time dateTime={project.targetDate}>{formatDate(project.targetDate)}</time>
            </span>
          </span>
          <span className="flex items-center gap-2">
            <Avatar name={project.manager.name} size="sm" />
            {project.manager.name}, project manager
          </span>
        </>
      }
      actions={<ProjectActions />}
    />
  );
}

/** The same on every tab, and they don't need the project loaded. */
function ProjectActions() {
  return (
    <>
      <Button asChild>
        <Link href="/documents">
          <Folder />
          Files
        </Link>
      </Button>
      <Button asChild>
        <Link href="/inventory">
          <Package />
          Request materials
        </Link>
      </Button>
      <Button
        variant="primary"
        onClick={() => toast("The daily report form comes with the field app.")}
      >
        <Plus />
        Daily report
      </Button>
    </>
  );
}

/**
 * No project at this address. `data-project-missing` is what the layout
 * looks for to hide the stats, tabs and panels below, which would otherwise
 * each report the same 404.
 */
function ProjectMissing() {
  return (
    <div data-project-missing className="flex flex-col gap-5">
      <Breadcrumb items={[PROJECTS_CRUMB, { label: "Not found" }]} />
      <Card>
        <EmptyState
          icon={<SearchX />}
          title="There's no project here"
          description="It may have been removed, or the link is wrong. Every project is listed on Projects & sites."
          action={
            <Button asChild>
              <Link href="/projects">Back to projects</Link>
            </Button>
          }
        />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary figures
// ---------------------------------------------------------------------------

/** The four figures under the header: progress, money, time and people. */
export function ProjectStats() {
  return (
    // An error here is the header's error too (same request), and it says so.
    <QueryBoundary fallback={<StatsSkeleton />} errorFallback={() => null}>
      <StatsContent />
    </QueryBoundary>
  );
}

function StatsSkeleton() {
  const labels = ["Overall progress", "Spent of budget", "Time remaining", "On site today"];
  return (
    <StatStrip>
      {labels.map((label) => (
        <Stat
          key={label}
          label={label}
          value={<Skeleton className="my-1 h-5 w-24" />}
          meta={<Skeleton className="h-3.5 w-36" />}
        />
      ))}
    </StatStrip>
  );
}

function StatsContent() {
  const { data: project } = useProject(useProjectId());
  const now = new Date();
  const used = project.budget > 0 ? project.spent / project.budget : 0;

  return (
    <StatStrip>
      <Stat
        label="Overall progress"
        value={formatPercent(project.progress)}
        meta={
          <Progress
            value={Math.round(project.progress * 100)}
            aria-label="Overall progress"
            className="mt-1.5"
          />
        }
      />
      <Stat
        label="Spent of budget"
        value={
          <span title={`${formatMoney(project.spent)} of ${formatMoney(project.budget)}`}>
            {formatMoneyCompact(project.spent)}{" "}
            <span className="text-md font-medium text-ink-3">
              / {formatMoneyCompact(project.budget)}
            </span>
          </span>
        }
        meta={`${formatPercent(used)} used · ${formatMoneyCompact(project.committed - project.spent)} committed, unpaid`}
      />
      <TimeStat project={project} now={now} />
      <Stat
        label="On site today"
        value={formatNumber(project.crew?.onSite ?? 0)}
        meta={
          project.crewSplit
            ? `${formatNumber(project.crewSplit.direct)} direct · ${formatNumber(project.crewSplit.subcontract)} subcontract`
            : crewLabel(project, now)
        }
      />
    </StatStrip>
  );
}

/** What time means depends on where the project is in its life. */
function TimeStat({ project, now }: { project: ProjectDetail; now: Date }) {
  switch (project.status) {
    case "planning":
      return (
        <Stat
          label="Starts"
          value={formatDate(project.startDate)}
          meta={capitalize(formatRelativeDay(project.startDate, now))}
        />
      );
    case "on_hold":
      return (
        <Stat
          label="On hold since"
          value={formatDate(project.pausedDate ?? project.startDate)}
          meta={`Was due ${formatDate(project.targetDate)}`}
        />
      );
    case "completed":
      return (
        <Stat
          label="Handed over"
          value={formatDate(project.completedDate ?? project.targetDate)}
          meta={capitalize(formatRelativeDay(project.completedDate ?? project.targetDate, now))}
        />
      );
    case "active": {
      const remaining = daysBetween(now, project.targetDate);
      const length = daysBetween(project.startDate, project.targetDate);
      const elapsed = length > 0 ? daysBetween(project.startDate, now) / length : 1;
      return remaining >= 0 ? (
        <Stat
          label="Time remaining"
          value={formatCount(remaining, "day")}
          meta={`${formatPercent(Math.min(1, Math.max(0, elapsed)))} of programme elapsed`}
        />
      ) : (
        <Stat
          label="Past its target"
          value={`${formatCount(-remaining, "day")} over`}
          meta={`Was due ${formatDate(project.targetDate)}`}
        />
      );
    }
  }
}
