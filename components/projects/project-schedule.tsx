"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { CalendarRange, Flag } from "lucide-react";
import { GanttChart, GanttLegend } from "@/components/charts/gantt-chart";
import { QueryBoundary } from "@/components/data/query-boundary";
import { useProjectId } from "@/components/projects/project-link";
import { MILESTONE_STATUS } from "@/components/projects/project-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateBox } from "@/components/ui/date-box";
import { EmptyState } from "@/components/ui/empty-state";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemTitle,
} from "@/components/ui/list";
import { ListSkeleton, Skeleton } from "@/components/ui/skeleton";
import {
  formatDate,
  formatMonthYearShort,
  formatPercent,
  formatRelativeDay,
  toISODate,
} from "@/lib/format";
import { projectQueries, useMilestones } from "@/lib/queries/projects";

/** A project's programme as a timeline, and its milestones in full. */
export function ProjectSchedule() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Programme</CardTitle>
          <CardDescription>
            Planned dates by phase; the filled part of each bar is work complete
          </CardDescription>
          <CardAction>
            <GanttLegend />
          </CardAction>
        </CardHeader>
        <QueryBoundary
          fallback={
            <div className="p-4.5">
              <Skeleton className="h-96" />
            </div>
          }
        >
          <Programme />
        </QueryBoundary>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>Key dates on the programme, past and to come</CardDescription>
        </CardHeader>
        <QueryBoundary fallback={<ListSkeleton rows={4} />}>
          <MilestoneList />
        </QueryBoundary>
      </Card>
    </div>
  );
}

function Programme() {
  const id = useProjectId();
  // Three requests at once. Three useSuspenseQuery calls in a row would make
  // them one after another: each suspends the component before the next runs.
  const [{ data: project }, { data: phases }, { data: milestones }] = useSuspenseQueries({
    queries: [
      projectQueries.detail(id),
      projectQueries.phases(id),
      projectQueries.milestones({ projectId: id }),
    ],
  });

  if (phases.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange />}
        title="No programme yet"
        description="The timeline shows here once the phases are planned."
        className="py-8"
      />
    );
  }

  // Wide enough for the whole programme and anything that falls outside it.
  const dates = [
    project.startDate,
    project.targetDate,
    ...phases.flatMap((phase) => [phase.plannedStart, phase.plannedFinish]),
    ...milestones.map((milestone) => milestone.dueDate),
  ].sort();

  return (
    <GanttChart
      aria-label={`Programme for ${project.name}`}
      rowsLabel="Phase"
      from={dates[0]!}
      to={dates.at(-1)!}
      today={toISODate(new Date())}
      rows={phases.map((phase) => ({
        key: phase.id,
        label: phase.name,
        meta: `${formatMonthYearShort(phase.plannedStart)} – ${formatMonthYearShort(phase.plannedFinish)} · ${formatPercent(phase.progress)}`,
        start: phase.plannedStart,
        finish: phase.plannedFinish,
        progress: phase.progress,
      }))}
      markers={milestones.map((milestone) => ({
        key: milestone.id,
        label: `${milestone.title} · ${formatDate(milestone.dueDate)}`,
        date: milestone.dueDate,
        done: milestone.status === "done",
      }))}
    />
  );
}

function MilestoneList() {
  const { data: milestones } = useMilestones({ projectId: useProjectId() });
  const now = new Date();

  if (milestones.length === 0) {
    return (
      <EmptyState
        icon={<Flag />}
        title="No milestones yet"
        description="Key dates on the programme show here."
        className="py-8"
      />
    );
  }

  return (
    <List>
      {milestones.map((milestone) => {
        const status = MILESTONE_STATUS[milestone.status];
        return (
          <ListItem key={milestone.id}>
            <DateBox date={milestone.dueDate} />
            <ListItemContent>
              <ListItemTitle>{milestone.title}</ListItemTitle>
              <ListItemDescription>
                {formatDate(milestone.dueDate, "long")} ·{" "}
                {formatRelativeDay(milestone.dueDate, now)}
              </ListItemDescription>
            </ListItemContent>
            <Badge tone={status.tone}>{status.label}</Badge>
          </ListItem>
        );
      })}
    </List>
  );
}
