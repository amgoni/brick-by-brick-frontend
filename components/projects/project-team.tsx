"use client";

import { Building2, Users } from "lucide-react";
import Link from "next/link";
import { QueryBoundary } from "@/components/data/query-boundary";
import { useProjectId } from "@/components/projects/project-link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemIcon,
  ListItemTitle,
} from "@/components/ui/list";
import { ListSkeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { formatMoneyCompact, formatNumber } from "@/lib/format";
import { useProjectTeam } from "@/lib/queries/projects";
import { getInitials } from "@/lib/utils";

/** Who's on the project: your own people, and the subcontractors' crews. */
export function ProjectTeam() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(26.25rem,100%),1fr))] items-start gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Site team</CardTitle>
          <CardDescription>Your people on this project</CardDescription>
          <CardAction>
            <Button asChild size="sm">
              <Link href="/staff">Assign</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <QueryBoundary fallback={<ListSkeleton rows={4} />}>
          <Members />
        </QueryBoundary>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subcontractors</CardTitle>
          <CardDescription>Crew numbers from today&apos;s gate log</CardDescription>
          <CardAction>
            <Button
              size="sm"
              onClick={() => toast("Adding subcontractors comes with the Suppliers module.")}
            >
              Add
            </Button>
          </CardAction>
        </CardHeader>
        <QueryBoundary fallback={<ListSkeleton rows={2} />}>
          <Subcontractors />
        </QueryBoundary>
      </Card>
    </div>
  );
}

function Members() {
  const { data: team } = useProjectTeam(useProjectId());

  if (team.members.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="Nobody assigned yet"
        description="Assign staff from the Staff page."
        className="py-8"
      />
    );
  }

  return (
    <List>
      {team.members.map((member) => (
        <ListItem key={member.person.id}>
          <Avatar name={member.person.name} />
          <ListItemContent>
            <ListItemTitle>{member.person.name}</ListItemTitle>
            <ListItemDescription>
              {member.role}
              {member.leads !== null && ` · leads ${formatNumber(member.leads)} labourers`}
            </ListItemDescription>
          </ListItemContent>
          {member.onSiteToday ? (
            <Badge tone="success">On site</Badge>
          ) : (
            <Badge tone="neutral">Off site</Badge>
          )}
        </ListItem>
      ))}
    </List>
  );
}

function Subcontractors() {
  const { data: team } = useProjectTeam(useProjectId());

  if (team.subcontractors.length === 0) {
    return (
      <EmptyState
        icon={<Building2 />}
        title="No subcontractors"
        description="Firms working on this site under contract show here, with today's crew."
        className="py-8"
      />
    );
  }

  return (
    <List>
      {team.subcontractors.map((subcontractor) => (
        <ListItem key={subcontractor.id}>
          <ListItemIcon className="text-xs font-semibold">
            {getInitials(subcontractor.name)}
          </ListItemIcon>
          <ListItemContent>
            <ListItemTitle>{subcontractor.name}</ListItemTitle>
            <ListItemDescription>
              {subcontractor.trade} · contract {formatMoneyCompact(subcontractor.contractValue)}
            </ListItemDescription>
          </ListItemContent>
          <span className="shrink-0 text-md tabular-nums">
            <span className="font-medium">{formatNumber(subcontractor.crewToday)}</span>
            <span className="text-ink-3"> on site</span>
          </span>
        </ListItem>
      ))}
    </List>
  );
}
