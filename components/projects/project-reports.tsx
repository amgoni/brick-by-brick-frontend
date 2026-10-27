"use client";

import { ClipboardList, Image as ImageIcon } from "lucide-react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { useProjectId } from "@/components/projects/project-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateBox } from "@/components/ui/date-box";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListItem } from "@/components/ui/list";
import { ListSkeleton } from "@/components/ui/skeleton";
import { formatCount, formatNumber, formatTime } from "@/lib/format";
import { useSiteReports } from "@/lib/queries/projects";

/** The site team's daily reports for one project, newest first. */
export function ProjectReports() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily site reports</CardTitle>
        <CardDescription>Filed by the site team from the field app</CardDescription>
      </CardHeader>
      <QueryBoundary fallback={<ListSkeleton rows={4} />}>
        <ReportList />
      </QueryBoundary>
    </Card>
  );
}

function ReportList() {
  const { data: reports } = useSiteReports({ projectId: useProjectId(), limit: 30 });

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="No reports yet"
        description="Reports filed from site with the field app show here, newest first."
      />
    );
  }

  return (
    <List>
      {reports.map((report) => (
        <ListItem key={report.id} className="flex-wrap items-start gap-x-4 gap-y-3">
          <DateBox date={report.submittedAt} />
          <div className="min-w-0 flex-[1_1_20rem]">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 className="text-md font-medium">{report.title}</h2>
              {report.hoursLost > 0 ? (
                <Badge tone="warning">{formatNumber(report.hoursLost)} h lost</Badge>
              ) : (
                <Badge tone="success">No delays</Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-ink-3">
              {report.author.name} · {formatNumber(report.crewOnSite)} on site · {report.weather} ·
              filed <time dateTime={report.submittedAt}>{formatTime(report.submittedAt)}</time>
            </p>
            <p className="mt-2 max-w-[70ch] text-md text-ink-2">{report.summary}</p>
          </div>
          {/* Photos are kept once file storage exists; until then, how many. */}
          <div className="flex items-center gap-2 text-sm text-ink-3">
            <span className="flex h-10.5 w-14 items-center justify-center rounded-md border border-dashed border-line-strong">
              <ImageIcon aria-hidden="true" />
            </span>
            {formatCount(report.photoCount, "photo")}
          </div>
        </ListItem>
      ))}
    </List>
  );
}
