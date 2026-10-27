"use client";

import { Download, Plus } from "lucide-react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { BrowserOnly } from "@/components/ui/browser-only";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { formatCount, formatDate, formatGreeting } from "@/lib/format";
import { useDashboardSummary } from "@/lib/queries/dashboard";
import { useCurrentUser } from "@/lib/queries/me";
import { useUiStore } from "@/store/ui.store";

/**
 * "Good morning, Adaeze" over today's date. Both depend on the clock (and the
 * name on the API), so each is its own browser-only piece with a skeleton;
 * the buttons don't, and work from the first paint.
 */
export function DashboardHeader() {
  const openCommand = useUiStore((state) => state.openCommand);

  return (
    <PageHeader
      eyebrow={
        <BrowserOnly fallback={<Skeleton className="h-4.5 w-48" />}>
          <Today />
        </BrowserOnly>
      }
      title={
        <QueryBoundary
          fallback={<Skeleton className="h-7.5 w-72 max-w-full" />}
          errorFallback={() => "Dashboard"}
        >
          <Greeting />
        </QueryBoundary>
      }
      description={
        <QueryBoundary
          fallback={<Skeleton className="h-5 w-80 max-w-full" />}
          errorFallback={() => "Where things stand across your sites."}
        >
          <SitesSummary />
        </QueryBoundary>
      }
      actions={
        <>
          <Button onClick={() => toast("Exports arrive with the Reports module.")}>
            <Download />
            Export report
          </Button>
          {/* The palette, opened at its Create actions. */}
          <Button variant="primary" onClick={() => openCommand("New")}>
            <Plus />
            New
          </Button>
        </>
      }
    />
  );
}

function Today() {
  return formatDate(new Date(), "full");
}

function Greeting() {
  const { data: user } = useCurrentUser();
  const firstName = user.name.split(" ")[0] ?? user.name;
  return `${formatGreeting(new Date())}, ${firstName}`;
}

function SitesSummary() {
  const { data } = useDashboardSummary();
  return `Here's where things stand across ${formatCount(data.sites.active, "active site")}.`;
}
