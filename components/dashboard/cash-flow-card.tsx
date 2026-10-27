"use client";

import { ChartColumn, Table2 } from "lucide-react";
import { useState } from "react";
import { ColumnChart, ColumnLegend, type ColumnSeries } from "@/components/charts/column-chart";
import { QueryBoundary } from "@/components/data/query-boundary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { cn } from "@/lib/cn";
import { formatMoneyCompact, formatMonth, formatNumber, formatPercent } from "@/lib/format";
import { useCashFlow } from "@/lib/queries/reports";

const SERIES: ColumnSeries[] = [
  { key: "invoiced", label: "Invoiced", appearance: "outline" },
  { key: "collected", label: "Collected", appearance: "solid" },
];

const MILLION = 1_000_000;

/**
 * Invoiced against collected, month by month. The period switch is a view of
 * one year of data fetched once, so switching it never shows a loading state.
 */
export function CashFlowCard() {
  const [period, setPeriod] = useState("6");
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash flow</CardTitle>
        <CardDescription>Invoiced vs collected, ₦ millions</CardDescription>
        <CardAction>
          <Segmented value={period} onValueChange={setPeriod} aria-label="Period">
            <SegmentedItem value="6">6 months</SegmentedItem>
            <SegmentedItem value="12">12 months</SegmentedItem>
          </Segmented>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={view === "chart" ? "Show as a table" : "Show as a chart"}
            onClick={() => setView((current) => (current === "chart" ? "table" : "chart"))}
          >
            {view === "chart" ? <Table2 /> : <ChartColumn />}
          </Button>
        </CardAction>
      </CardHeader>
      <QueryBoundary
        fallback={
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-4.5 w-3/4" />
            <Skeleton className="h-54" />
          </CardContent>
        }
      >
        <CashFlowBody months={Number(period)} view={view} />
      </QueryBoundary>
    </Card>
  );
}

function CashFlowBody({ months, view }: { months: number; view: "chart" | "table" }) {
  const { data, isFetching } = useCashFlow(12);
  const shown = data.slice(-months);
  const [selected, setSelected] = useState<string>();
  // The API ends the series with the current month, so the last one is "to date".
  const latest = data.at(-1);
  const current = shown.find((month) => month.month === selected) ?? shown.at(-1);

  if (view === "table") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead numeric>Invoiced</TableHead>
            <TableHead numeric>Collected</TableHead>
            <TableHead numeric>Collected %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((month) => (
            <TableRow key={month.month}>
              <TableCell className="h-11">
                {formatMonth(month.month, "long")}
                {month.month === latest?.month && <span className="text-ink-3"> (to date)</span>}
              </TableCell>
              <TableCell numeric className="h-11">
                {formatMoneyCompact(month.invoiced)}
              </TableCell>
              <TableCell numeric className="h-11">
                {formatMoneyCompact(month.collected)}
              </TableCell>
              <TableCell numeric className="h-11">
                {formatPercent(month.invoiced > 0 ? month.collected / month.invoiced : 0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <CardContent className="flex flex-col gap-2 pt-3.5 pb-4.5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <ColumnLegend series={SERIES} />
        {current && (
          <p aria-live="polite" className="text-sm text-ink-2 tabular-nums">
            <strong className="font-semibold text-ink">
              {formatMonth(current.month, "long")}
              {current.month === latest?.month && " (to date)"}
            </strong>{" "}
            · Invoiced {formatMoneyCompact(current.invoiced)} · Collected{" "}
            {formatMoneyCompact(current.collected)} (
            {formatPercent(current.invoiced > 0 ? current.collected / current.invoiced : 0)})
          </p>
        )}
      </div>
      <ColumnChart
        // Hold the last render, dimmed, while a background refetch runs.
        className={cn("transition-opacity", isFetching && "opacity-60")}
        aria-label="Cash flow by month"
        series={SERIES}
        data={shown.map((month) => ({
          key: month.month,
          label: formatMonth(month.month),
          description: formatMonth(month.month, "long"),
          values: { invoiced: month.invoiced / MILLION, collected: month.collected / MILLION },
        }))}
        selected={current?.month ?? ""}
        onSelectedChange={setSelected}
        formatValue={(millions) => formatMoneyCompact(millions * MILLION)}
        formatTick={(millions) => formatNumber(millions)}
      />
    </CardContent>
  );
}
