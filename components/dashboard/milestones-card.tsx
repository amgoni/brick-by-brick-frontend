"use client";

import { CalendarCheck } from "lucide-react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { projectHref } from "@/components/projects/project-link";
import { MILESTONE_STATUS } from "@/components/projects/project-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateBox } from "@/components/ui/date-box";
import { EmptyState } from "@/components/ui/empty-state";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemTitle,
} from "@/components/ui/list";
import { ListSkeleton } from "@/components/ui/skeleton";
import { useMilestones } from "@/lib/queries/projects";

const WINDOW_DAYS = 14;

export function MilestonesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming milestones</CardTitle>
        <CardDescription>Next {WINDOW_DAYS} days</CardDescription>
      </CardHeader>
      <QueryBoundary fallback={<ListSkeleton rows={5} />}>
        <MilestoneList />
      </QueryBoundary>
    </Card>
  );
}

function MilestoneList() {
  const { data: milestones } = useMilestones({ dueWithinDays: WINDOW_DAYS });

  if (milestones.length === 0) {
    return (
      <EmptyState
        icon={<CalendarCheck />}
        title={`Nothing due in the next ${WINDOW_DAYS} days`}
        className="py-8"
      />
    );
  }

  return (
    <List>
      {milestones.map((milestone) => {
        const status = MILESTONE_STATUS[milestone.status];
        return (
          <ListItem key={milestone.id} href={projectHref(milestone.project.id, "schedule")}>
            <DateBox date={milestone.dueDate} />
            <ListItemContent>
              <ListItemTitle>{milestone.title}</ListItemTitle>
              <ListItemDescription>{milestone.project.name}</ListItemDescription>
            </ListItemContent>
            <Badge tone={status.tone}>{status.label}</Badge>
          </ListItem>
        );
      })}
    </List>
  );
}
