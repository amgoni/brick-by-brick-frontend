"use client";

import { CalendarRange, CircleCheck, Package, Plus, Warehouse } from "lucide-react";
import Link from "next/link";
import { QueryBoundary } from "@/components/data/query-boundary";
import { byUrgency, StockStateBadge } from "@/components/inventory/stock-status";
import { useProjectId } from "@/components/projects/project-link";
import { ISSUE_SEVERITY, PHASE_STATUS } from "@/components/projects/project-status";
import { ProjectTabButton } from "@/components/projects/project-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DescriptionItem, DescriptionList } from "@/components/ui/description-list";
import { EmptyState } from "@/components/ui/empty-state";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemTitle,
} from "@/components/ui/list";
import { Progress } from "@/components/ui/progress";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { formatNumber, formatPercent, formatRelativeDay } from "@/lib/format";
import { useProject, useProjectIssues, useProjectPhases } from "@/lib/queries/projects";
import { useStockLevels } from "@/lib/queries/stock";
import { capitalize } from "@/lib/utils";

/** A project's first tab: how each phase is going, what's wrong, what's on site. */
export function ProjectOverview() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 flex-[2_1_35rem] flex-col gap-4">
        <PhasesCard />
        <IssuesCard />
      </div>
      <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-4">
        <SiteDetailsCard />
        <MaterialsCard />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

function PhasesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phases</CardTitle>
        <CardDescription>Progress through each phase of the works</CardDescription>
        <CardAction>
          <ProjectTabButton tab="schedule" size="sm">
            Open schedule
          </ProjectTabButton>
        </CardAction>
      </CardHeader>
      <QueryBoundary fallback={<ListSkeleton rows={6} />}>
        <PhaseList />
      </QueryBoundary>
    </Card>
  );
}

function PhaseList() {
  const { data: phases } = useProjectPhases(useProjectId());

  if (phases.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange />}
        title="No programme yet"
        description="Phases show here once the programme is set up."
        className="py-8"
      />
    );
  }

  // Phone: name, percentage and status on one line, the bar under them.
  // From the breakpoint up, all four side by side.
  return (
    <ul>
      {phases.map((phase) => {
        const status = PHASE_STATUS[phase.status];
        return (
          <li
            key={phase.id}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3.5 gap-y-2 border-b border-line px-4.5 py-3 last:border-b-0 md:grid-cols-[minmax(9.5rem,1.3fr)_minmax(7.5rem,2fr)_2.75rem_5.75rem]"
          >
            <span className="text-md">{phase.name}</span>
            <Progress
              value={Math.round(phase.progress * 100)}
              aria-label={`${phase.name}: ${formatPercent(phase.progress)} complete`}
              className="col-span-full row-start-2 md:col-span-1 md:row-start-auto"
            />
            <span className="text-right text-sm tabular-nums">{formatPercent(phase.progress)}</span>
            <Badge tone={status.tone} className="justify-self-end">
              {status.label}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Issues
// ---------------------------------------------------------------------------

function IssuesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Open issues</CardTitle>
        <CardAction>
          <Button size="sm" onClick={() => toast("Logging issues is on the build list.")}>
            <Plus />
            Log issue
          </Button>
        </CardAction>
      </CardHeader>
      <QueryBoundary fallback={<ListSkeleton rows={3} />}>
        <IssueList />
      </QueryBoundary>
    </Card>
  );
}

function IssueList() {
  const { data: issues } = useProjectIssues(useProjectId());
  const now = new Date();

  if (issues.length === 0) {
    return (
      <EmptyState
        icon={<CircleCheck />}
        title="No open issues"
        description="Problems logged on site show here until they're resolved."
        className="py-8"
      />
    );
  }

  return (
    <List>
      {issues.map((issue) => {
        const severity = ISSUE_SEVERITY[issue.severity];
        const detail = [issue.description, issue.assignee && `Assigned to ${issue.assignee.name}`]
          .filter(Boolean)
          .join(" · ");
        return (
          <ListItem key={issue.id} className="items-start">
            {/* Wide enough for "Medium", so the titles beside them line up. */}
            <Badge tone={severity.tone} className="mt-px w-19 justify-center">
              {severity.label}
            </Badge>
            <ListItemContent>
              <ListItemTitle>{issue.title}</ListItemTitle>
              {detail && <ListItemDescription>{detail}</ListItemDescription>}
            </ListItemContent>
            <time dateTime={issue.raisedAt} className="shrink-0 text-sm text-ink-3">
              {capitalize(formatRelativeDay(issue.raisedAt, now))}
            </time>
          </ListItem>
        );
      })}
    </List>
  );
}

// ---------------------------------------------------------------------------
// Site details
// ---------------------------------------------------------------------------

function SiteDetailsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Site details</CardTitle>
        <CardAction>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toast("Editing a project comes with the forms step.")}
          >
            Edit
          </Button>
        </CardAction>
      </CardHeader>
      <QueryBoundary
        fallback={
          <CardContent className="flex flex-col gap-3.5">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-4" />
            ))}
          </CardContent>
        }
      >
        <SiteDetails />
      </QueryBoundary>
    </Card>
  );
}

function SiteDetails() {
  const { data: project } = useProject(useProjectId());
  const none = (text: string) => <span className="text-ink-3">{text}</span>;
  return (
    <CardContent>
      <DescriptionList termWidth="8.125rem">
        <DescriptionItem label="Project code">
          <span className="font-mono text-sm">{project.code}</span>
        </DescriptionItem>
        <DescriptionItem label="Client">
          {project.client?.name ?? "Own development"}
        </DescriptionItem>
        <DescriptionItem label="Scope">{project.scope}</DescriptionItem>
        <DescriptionItem label="Contract">{project.contractType}</DescriptionItem>
        <DescriptionItem label="Building permit">
          {project.permitNumber ? (
            <span className="font-mono text-sm">{project.permitNumber}</span>
          ) : (
            none("None on record")
          )}
        </DescriptionItem>
        <DescriptionItem label="Site engineer">
          {project.siteEngineer?.name ?? none("Not assigned")}
        </DescriptionItem>
        <DescriptionItem label="Store">
          {project.store?.name ?? none("No site store")}
        </DescriptionItem>
      </DescriptionList>
    </CardContent>
  );
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

function MaterialsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Materials on site</CardTitle>
        <CardAction>
          <Button asChild size="sm">
            <Link href="/inventory">Inventory</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <QueryBoundary fallback={<ListSkeleton rows={4} />}>
        <Materials />
      </QueryBoundary>
    </Card>
  );
}

/**
 * Stock is kept by store, so this needs the project's store before it can
 * ask for the stock: a dependent query. The project is nearly always cached
 * by then (the header asked for it first), so in practice it's one request.
 */
function Materials() {
  const { data: project } = useProject(useProjectId());

  if (!project.store) {
    return (
      <EmptyState
        icon={<Warehouse />}
        title="No store on this site"
        description="Materials are tracked here once the site has a store."
        className="py-8"
      />
    );
  }
  return <StoreStock storeId={project.store.id} />;
}

function StoreStock({ storeId }: { storeId: string }) {
  const { data: items } = useStockLevels({ locationId: storeId });

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Package />}
        title="Nothing in stock here"
        description="Deliveries to this site's store show here."
        className="py-8"
      />
    );
  }

  return (
    <List>
      {[...items].sort(byUrgency).map((item) => (
        <ListItem key={item.id}>
          <ListItemContent>
            <ListItemTitle>{item.name}</ListItemTitle>
            <ListItemDescription>
              Reorder at {formatNumber(item.reorderLevel)} {item.unit}
            </ListItemDescription>
          </ListItemContent>
          <span className="shrink-0 text-md font-medium tabular-nums">
            {formatNumber(item.quantity, { decimals: 1 })} {item.unit}
          </span>
          <StockStateBadge item={item} />
        </ListItem>
      ))}
    </List>
  );
}
