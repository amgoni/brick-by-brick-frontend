"use client";

import { ClipboardList } from "lucide-react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { projectHref } from "@/components/projects/project-link";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListItem, ListItemContent, ListItemTitle } from "@/components/ui/list";
import { ListSkeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { useSiteReports } from "@/lib/queries/projects";

export function SiteReportsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest site reports</CardTitle>
        <CardDescription>Submitted from the field app</CardDescription>
      </CardHeader>
      <QueryBoundary fallback={<ListSkeleton rows={3} />}>
        <ReportList />
      </QueryBoundary>
    </Card>
  );
}

function ReportList() {
  const { data: reports } = useSiteReports({ limit: 3 });
  const now = new Date();

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="No reports yet"
        description="Daily reports filed from site appear here."
        className="py-8"
      />
    );
  }

  // Each opens its project's reports, where the rest of them are.
  return (
    <List>
      {reports.map((report) => (
        <ListItem
          key={report.id}
          href={projectHref(report.project.id, "reports")}
          className="items-start"
        >
          <Avatar name={report.author.name} />
          <ListItemContent>
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <ListItemTitle>{report.project.name}</ListItemTitle>
              <time dateTime={report.submittedAt} className="text-sm text-ink-3">
                {formatDateTime(report.submittedAt, now)}
              </time>
            </div>
            <p className="mt-0.5 text-sm text-ink-3">
              {report.author.name} · {report.crewOnSite} on site
            </p>
            <p className="mt-1.5 line-clamp-2 text-md text-ink-2">{report.summary}</p>
          </ListItemContent>
        </ListItem>
      ))}
    </List>
  );
}
