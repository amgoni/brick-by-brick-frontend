"use client";

import {
  Download,
  HardHat,
  LayoutGrid,
  MapPin,
  Plus,
  Rows3,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { useDeferredValue, useState } from "react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { ProjectLink } from "@/components/projects/project-link";
import {
  crewLabel,
  describeProjectKind,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  projectKeyDate,
  projectPlace,
  projectStatus,
  ProjectStatusBadge,
} from "@/components/projects/project-status";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { DescriptionItem, DescriptionList } from "@/components/ui/description-list";
import { EmptyState } from "@/components/ui/empty-state";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { useStoredState } from "@/hooks/use-stored-state";
import type { Project, ProjectStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { downloadCsv, type CsvColumn } from "@/lib/csv";
import {
  formatCount,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
  toISODate,
} from "@/lib/format";
import { useProjects } from "@/lib/queries/projects";

type StatusFilter = ProjectStatus | "all";

interface Filters {
  status: StatusFilter;
  query: string;
}

const VIEWS = ["cards", "table"] as const;
type View = (typeof VIEWS)[number];

/*
 * A company has tens of projects, not thousands, so the list loads them all
 * once and filters in the browser: every chip and keystroke answers
 * instantly, with no request and no loading state. Inventory and invoices
 * will grow too long for that, and will filter and page on the server.
 */

/** Every word typed has to appear somewhere: "lagos chinedu" finds his Lagos sites. */
function matches(project: Project, words: string[]): boolean {
  const text = [
    project.name,
    project.code,
    project.area,
    project.city,
    project.client?.name ?? "Own development",
    project.manager.name,
  ]
    .join(" ")
    .toLowerCase();
  return words.every((word) => text.includes(word));
}

function searchProjects(projects: Project[], query: string): Project[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return words.length ? projects.filter((project) => matches(project, words)) : projects;
}

function filterProjects(projects: Project[], { status, query }: Filters): Project[] {
  return searchProjects(projects, query).filter(
    (project) => status === "all" || project.status === status,
  );
}

/**
 * The Projects & sites page. The filter state lives here, above the parts
 * that need it: the export, the chips, the results. The page stays mounted
 * when you open a project (see "Preserving UI state" in Next's docs), so the
 * filters are still set when you come back.
 */
export function ProjectsBrowser() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useStoredState<View>("bbb:projects-view", "cards", VIEWS);
  // Typing stays responsive; the results catch up a beat behind.
  const filters: Filters = { status, query: useDeferredValue(query) };

  const clearFilters = () => {
    setStatus("all");
    setQuery("");
  };
  const statusChips = <StatusChips value={status} onValueChange={setStatus} />;

  return (
    <>
      <PageHeader
        title="Projects & sites"
        description="Every build, development and fit-out, with progress, money and people in one place."
        actions={
          <>
            <QueryBoundary fallback={<ExportButton disabled />} errorFallback={() => null}>
              <ExportProjects filters={filters} />
            </QueryBoundary>
            <Button
              variant="primary"
              onClick={() => toast("The new-project form is on the build list.")}
            >
              <Plus />
              New project
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* The chips work before the counts arrive, and without them if they fail. */}
        <QueryBoundary fallback={statusChips} errorFallback={() => statusChips}>
          <CountedStatusChips value={status} onValueChange={setStatus} query={filters.query} />
        </QueryBoundary>

        <div className="flex w-full min-w-0 items-center gap-2 md:w-auto md:flex-[0_1_26.25rem]">
          <InputGroup className="flex-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, location or client"
              aria-label="Search projects"
              // Our own clear button below replaces the browser's.
              className="[&::-webkit-search-cancel-button]:appearance-none"
            />
            {query && (
              <InputGroupAddon>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X />
                </Button>
              </InputGroupAddon>
            )}
          </InputGroup>
          {/* Phones always get cards: a table this wide would scroll sideways. */}
          <Segmented
            value={view}
            onValueChange={(next) => setView(next as View)}
            aria-label="Show projects as"
            className="max-md:hidden"
          >
            <SegmentedItem value="cards" aria-label="Cards">
              <LayoutGrid />
            </SegmentedItem>
            <SegmentedItem value="table" aria-label="Table">
              <Rows3 />
            </SegmentedItem>
          </Segmented>
        </div>
      </div>

      <QueryBoundary fallback={<ProjectGridSkeleton />}>
        <ProjectResults filters={filters} view={view} onClearFilters={clearFilters} />
      </QueryBoundary>
    </>
  );
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

interface StatusChipsProps {
  value: StatusFilter;
  onValueChange: (value: StatusFilter) => void;
  counts?: Record<StatusFilter, number>;
}

function StatusChips({ value, onValueChange, counts }: StatusChipsProps) {
  return (
    <ChipGroup
      value={value}
      onValueChange={(next) => onValueChange(next as StatusFilter)}
      aria-label="Filter by status"
    >
      <Chip value="all" count={counts?.all}>
        All
      </Chip>
      {PROJECT_STATUSES.map((option) => (
        <Chip key={option.value} value={option.value} count={counts?.[option.value]}>
          {option.label}
        </Chip>
      ))}
    </ChipGroup>
  );
}

/** Counts follow the search, so each chip says how many matches it holds. */
function CountedStatusChips({ query, ...props }: StatusChipsProps & { query: string }) {
  const { data: projects } = useProjects();
  const found = searchProjects(projects, query);
  const counts: Record<StatusFilter, number> = {
    all: found.length,
    planning: 0,
    active: 0,
    on_hold: 0,
    completed: 0,
  };
  for (const project of found) counts[project.status] += 1;
  return <StatusChips {...props} counts={counts} />;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function ProjectResults({
  filters,
  view,
  onClearFilters,
}: {
  filters: Filters;
  view: View;
  onClearFilters: () => void;
}) {
  const { data: projects } = useProjects();
  const shown = filterProjects(projects, filters);
  const now = new Date();

  let results: React.ReactNode;
  if (projects.length === 0) {
    results = (
      <Card>
        <EmptyState
          icon={<HardHat />}
          title="No projects yet"
          description="Add your first project to track its progress, budget and site activity."
        />
      </Card>
    );
  } else if (shown.length === 0) {
    results = (
      <Card className="border-dashed">
        <EmptyState
          icon={<SearchX />}
          title="No projects match"
          description="Try another status or clear the search."
          action={
            <Button size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          }
        />
      </Card>
    );
  } else if (view === "table") {
    results = (
      <>
        <ProjectGrid projects={shown} now={now} className="md:hidden" />
        <ProjectTable projects={shown} className="max-md:hidden" />
      </>
    );
  } else {
    results = <ProjectGrid projects={shown} now={now} />;
  }

  return (
    <>
      {/* Says what a filter did, for anyone who can't see the grid change. */}
      <p aria-live="polite" className="sr-only">
        Showing {shown.length} of {formatCount(projects.length, "project")}
      </p>
      {results}
    </>
  );
}

const GRID_CLASSES = "grid grid-cols-[repeat(auto-fill,minmax(min(20.625rem,100%),1fr))] gap-4";

function ProjectGrid({
  projects,
  now,
  className,
}: {
  projects: Project[];
  now: Date;
  className?: string;
}) {
  return (
    <ul className={cn(GRID_CLASSES, className)}>
      {projects.map((project) => (
        <li key={project.id} className="flex">
          <ProjectCard project={project} now={now} />
        </li>
      ))}
    </ul>
  );
}

/**
 * The whole card is one link: the name's link stretches over it (::after),
 * so a tap anywhere opens the project and a screen reader hears one link,
 * named after the project, rather than a card full of them.
 */
function ProjectCard({ project, now }: { project: Project; now: Date }) {
  const keyDate = projectKeyDate(project);
  return (
    <article
      className={cn(
        "relative flex w-full flex-col gap-3.5 rounded-xl border border-line bg-surface p-4.5 transition-colors hover:border-line-strong",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base">
            <ProjectLink
              project={project}
              className="font-semibold outline-hidden after:absolute after:inset-0 after:rounded-xl"
            />
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-3">
            <MapPin aria-hidden="true" className="size-3.5" />
            {projectPlace(project)}
          </p>
        </div>
        <ProjectStatusBadge project={project} />
      </div>

      <p className="text-md text-ink-2">{describeProjectKind(project)}</p>

      <div>
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="text-ink-3">Progress</span>
          <span className="font-medium tabular-nums">{formatPercent(project.progress)}</span>
        </div>
        <Progress
          value={Math.round(project.progress * 100)}
          aria-label={`${project.name}: ${formatPercent(project.progress)} complete`}
        />
      </div>

      <DescriptionList layout="grid" className="mt-auto grid-cols-3 border-t border-line pt-3.5">
        <DescriptionItem label="Budget">
          <span title={formatMoney(project.budget)}>{formatMoneyCompact(project.budget)}</span>
        </DescriptionItem>
        <DescriptionItem label="Spent">
          <span title={formatMoney(project.spent)}>{formatMoneyCompact(project.spent)}</span>
        </DescriptionItem>
        <DescriptionItem label={keyDate.label}>
          <time dateTime={keyDate.date}>{keyDate.text}</time>
        </DescriptionItem>
      </DescriptionList>

      <div className="flex items-center gap-2.5">
        <Avatar name={project.manager.name} size="sm" />
        <span className="min-w-0 flex-1 truncate text-md">{project.manager.name}</span>
        <span className="shrink-0 text-sm text-ink-3">{crewLabel(project, now)}</span>
      </div>
    </article>
  );
}

function ProjectTable({ projects, className }: { projects: Project[]; className?: string }) {
  return (
    <Card className={className}>
      <Table className="min-w-245">
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Project lead</TableHead>
            <TableHead>Key date</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead numeric>Budget</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const keyDate = projectKeyDate(project);
            return (
              <TableRow key={project.id}>
                <TableCell className="h-15">
                  <ProjectLink project={project} />
                  <div className="text-sm text-ink-3">{projectPlace(project)}</div>
                </TableCell>
                <TableCell>
                  <div>{project.client?.name ?? "Own development"}</div>
                  <div className="text-sm text-ink-3">{PROJECT_TYPES[project.type]}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar name={project.manager.name} size="sm" />
                    {project.manager.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-ink-3">{keyDate.label}</div>
                  <time dateTime={keyDate.date} className="tabular-nums">
                    {keyDate.text}
                  </time>
                </TableCell>
                <TableCell className="w-[17%]">
                  <Progress
                    value={Math.round(project.progress * 100)}
                    showValue
                    aria-label={`${project.name}: ${formatPercent(project.progress)} complete`}
                  />
                </TableCell>
                <TableCell numeric className="font-medium" title={formatMoney(project.budget)}>
                  {formatMoneyCompact(project.budget)}
                </TableCell>
                <TableCell>
                  <ProjectStatusBadge project={project} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function ProjectGridSkeleton() {
  return (
    <div className={GRID_CLASSES} aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex flex-col gap-4 rounded-xl border border-line p-4.5">
          <div className="flex justify-between gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4.5 w-3/5" />
              <Skeleton className="h-3.5 w-2/5" />
            </div>
            <Skeleton className="h-5.5 w-18 rounded-full" />
          </div>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-1.5" />
          <div className="grid grid-cols-3 gap-4 border-t border-line pt-3.5">
            {Array.from({ length: 3 }, (_, column) => (
              <div key={column} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const EXPORT_COLUMNS: CsvColumn<Project>[] = [
  { header: "Code", value: (p) => p.code },
  { header: "Project", value: (p) => p.name },
  { header: "Type", value: (p) => PROJECT_TYPES[p.type] },
  { header: "Status", value: (p) => projectStatus(p).label },
  { header: "Stage", value: (p) => p.stage },
  { header: "Area", value: (p) => p.area },
  { header: "City", value: (p) => p.city },
  { header: "Client", value: (p) => p.client?.name ?? "Own development" },
  { header: "Project manager", value: (p) => p.manager.name },
  { header: "Start date", value: (p) => p.startDate },
  { header: "Target date", value: (p) => p.targetDate },
  { header: "Progress (%)", value: (p) => Math.round(p.progress * 100) },
  { header: "Budget (NGN)", value: (p) => p.budget },
  { header: "Spent (NGN)", value: (p) => p.spent },
  { header: "Billed (NGN)", value: (p) => p.billed },
  { header: "Crew on site", value: (p) => p.crew?.onSite },
];

function ExportButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button {...props}>
      <Download />
      Export
    </Button>
  );
}

/** Exports what's on screen: the current filter and search, every field in full. */
function ExportProjects({ filters }: { filters: Filters }) {
  const { data: projects } = useProjects();
  const shown = filterProjects(projects, filters);
  return (
    <ExportButton
      disabled={shown.length === 0}
      onClick={() => {
        downloadCsv(`projects-${toISODate(new Date())}.csv`, shown, EXPORT_COLUMNS);
        toast.success(`Exported ${formatCount(shown.length, "project")}`, {
          description: `Spreadsheet-ready CSV, amounts in naira (${formatNumber(shown.length)} rows).`,
        });
      }}
    />
  );
}
