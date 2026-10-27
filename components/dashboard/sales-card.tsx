"use client";

import Link from "next/link";
import { StackedBar } from "@/components/charts/stacked-bar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount } from "@/lib/format";
import { useDashboardSummary } from "@/lib/queries/dashboard";

export function SalesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales &amp; leasing</CardTitle>
        <CardDescription>
          <QueryBoundary
            fallback={<Skeleton className="h-4 w-48" />}
            errorFallback={() => "Units across your developments"}
          >
            <UnitsSummary />
          </QueryBoundary>
        </CardDescription>
        <CardAction>
          <Button asChild size="sm">
            <Link href="/properties">Open</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="pt-4 pb-4.5">
        <QueryBoundary fallback={<Skeleton className="h-22" />}>
          <UnitsBreakdown />
        </QueryBoundary>
      </CardContent>
    </Card>
  );
}

function UnitsSummary() {
  const { data } = useDashboardSummary();
  const total = Object.values(data.sales.units).reduce((sum, count) => sum + count, 0);
  return `${formatCount(total, "unit")} across ${formatCount(data.sales.developments, "development")}`;
}

function UnitsBreakdown() {
  const { units } = useDashboardSummary().data.sales;
  return (
    <StackedBar
      segments={[
        { key: "sold", label: "Sold", value: units.sold, shade: "full" },
        { key: "reserved", label: "Reserved", value: units.reserved, shade: "strong" },
        { key: "leased", label: "Leased", value: units.leased, shade: "soft" },
        { key: "available", label: "Available", value: units.available, shade: "outline" },
      ]}
    />
  );
}
