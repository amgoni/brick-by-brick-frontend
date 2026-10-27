"use client";

import { Banknote, HardHat, Receipt, Users } from "lucide-react";
import { describeError, QueryBoundary } from "@/components/data/query-boundary";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat";
import {
  formatCount,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { useDashboardSummary } from "@/lib/queries/dashboard";

const TILES = [
  { label: "Active sites", icon: HardHat, href: "/projects" },
  { label: "Contract value in progress", icon: Banknote, href: "/projects" },
  { label: "Receivables outstanding", icon: Receipt, href: "/invoices" },
  { label: "On site today", icon: Users, href: "/staff" },
] as const;

const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

/** The four headline figures. Labels are static, so they're in the first paint. */
export function KpiTiles() {
  return (
    <section
      aria-label="Key figures"
      className="grid grid-cols-[repeat(auto-fit,minmax(min(14.375rem,100%),1fr))] gap-4"
    >
      <QueryBoundary
        fallback={TILES.map(({ label, icon: Icon }) => (
          <StatCard
            key={label}
            label={label}
            icon={<Icon />}
            value={<Skeleton className="my-0.5 h-7 w-24" />}
            footer={<Skeleton className="h-4 w-36" />}
          />
        ))}
        errorFallback={({ error, retry }) => (
          <Card className="col-span-full">
            <ErrorState
              title="Couldn't load the headline figures"
              description={describeError(error)}
              onRetry={retry}
            />
          </Card>
        )}
      >
        <Tiles />
      </QueryBoundary>
    </section>
  );
}

function Tiles() {
  const { data } = useDashboardSummary();
  const { sites, contracts, receivables, crew } = data;
  const [activeSites, contractValue, receivablesTile, onSite] = TILES;

  return (
    <>
      <StatCard
        label={activeSites.label}
        icon={<activeSites.icon />}
        href={activeSites.href}
        value={formatNumber(sites.active)}
        footer={
          sites.behindSchedule > 0 ? (
            <Badge tone="warning">{sites.behindSchedule} behind schedule</Badge>
          ) : (
            <Badge tone="success">All on schedule</Badge>
          )
        }
      />
      <StatCard
        label={contractValue.label}
        icon={<contractValue.icon />}
        href={contractValue.href}
        value={
          <span title={formatMoney(contracts.inProgress)}>
            {formatMoneyCompact(contracts.inProgress)}
          </span>
        }
        footer={`${formatMoneyCompact(contracts.billed)} billed to date · ${formatPercent(
          ratio(contracts.billed, contracts.inProgress),
        )}`}
      />
      <StatCard
        label={receivablesTile.label}
        icon={<receivablesTile.icon />}
        href={receivablesTile.href}
        value={
          <span title={formatMoney(receivables.outstanding)}>
            {formatMoneyCompact(receivables.outstanding)}
          </span>
        }
        footer={
          receivables.overdueInvoices > 0 ? (
            <>
              <Badge tone="danger">{formatMoneyCompact(receivables.overdue)} overdue</Badge>
              {formatCount(receivables.overdueInvoices, "invoice")}
            </>
          ) : (
            <Badge tone="success">Nothing overdue</Badge>
          )
        }
      />
      <StatCard
        label={onSite.label}
        icon={<onSite.icon />}
        href={onSite.href}
        value={
          <>
            {formatNumber(crew.onSite)}{" "}
            <span className="text-lg font-medium text-ink-3">/ {formatNumber(crew.rostered)}</span>
          </>
        }
        footer={`${formatPercent(ratio(crew.onSite, crew.rostered))} of rostered crew clocked in`}
      />
    </>
  );
}
