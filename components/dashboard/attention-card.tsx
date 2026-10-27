"use client";

import { BadgeCheck, CircleCheck, Package, Receipt, Wrench, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { QueryBoundary } from "@/components/data/query-boundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { AttentionItem } from "@/lib/api/types";
import {
  daysBetween,
  formatCount,
  formatDate,
  formatMoney,
  formatNumber,
  formatRelativeDay,
} from "@/lib/format";
import { useDashboardSummary } from "@/lib/queries/dashboard";

export function AttentionCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardAction>
          <QueryBoundary fallback={null} errorFallback={() => null}>
            <AttentionCount />
          </QueryBoundary>
        </CardAction>
      </CardHeader>
      <QueryBoundary fallback={<ListSkeleton rows={4} />}>
        <AttentionList />
      </QueryBoundary>
    </Card>
  );
}

function AttentionCount() {
  const { data } = useDashboardSummary();
  return data.attention.length > 0 ? <Badge>{data.attention.length}</Badge> : null;
}

function AttentionList() {
  const { data } = useDashboardSummary();
  const now = new Date();

  if (data.attention.length === 0) {
    return (
      <EmptyState
        icon={<CircleCheck />}
        title="Nothing needs you right now"
        description="Low stock, overdue invoices, services and expiring certificates show up here."
      />
    );
  }

  return (
    <List>
      {data.attention.map((item) => {
        const view = describeAttention(item, now);
        return (
          <ListItem key={item.id}>
            <ListItemIcon className={view.tone === "danger" ? "text-danger" : "text-warning"}>
              <view.icon />
            </ListItemIcon>
            <ListItemContent>
              <ListItemTitle>{view.title}</ListItemTitle>
              <ListItemDescription>{view.description}</ListItemDescription>
            </ListItemContent>
            <Button asChild size="sm">
              <Link href={view.href}>{view.action}</Link>
            </Button>
          </ListItem>
        );
      })}
    </List>
  );
}

interface AttentionView {
  icon: LucideIcon;
  tone: "warning" | "danger";
  title: string;
  description: string;
  action: string;
  href: string;
}

/**
 * Turns the API's facts into words. `item.kind` narrows the union, so each
 * case sees only its own fields; the `never` at the end fails to compile if
 * the API grows a kind this doesn't handle yet.
 */
function describeAttention(item: AttentionItem, now: Date): AttentionView {
  switch (item.kind) {
    case "low_stock": {
      const out = item.quantity === 0;
      return {
        icon: Package,
        tone: out ? "danger" : "warning",
        title: out ? `${item.item.name} is out of stock` : `${item.item.name} running low`,
        description: [
          item.location.name,
          `${formatNumber(item.quantity, { decimals: 1 })} ${item.unit}, reorder at ${formatNumber(item.reorderLevel)}`,
          item.othersLow > 0 && `${formatCount(item.othersLow, "more item")} low`,
        ]
          .filter(Boolean)
          .join(" · "),
        action: "Reorder",
        href: "/inventory",
      };
    }
    case "overdue_invoice": {
      const days = daysBetween(item.dueDate, now);
      return {
        icon: Receipt,
        tone: "danger",
        title: `${item.invoice.number} is ${formatCount(days, "day")} overdue`,
        description: `${item.client.name} · ${formatMoney(item.balance)}`,
        action: "Chase",
        href: "/invoices",
      };
    }
    case "service_due":
      return {
        icon: Wrench,
        tone: "warning",
        title: `${item.equipment.name} service due`,
        description: `${item.equipment.code} · ${item.service} ${formatRelativeDay(item.dueDate, now)}`,
        action: "Schedule",
        href: "/equipment",
      };
    case "certifications_expiring":
      return {
        icon: BadgeCheck,
        tone: "warning",
        title: `${formatCount(item.count, "certification")} expiring`,
        description: `${item.certification} · by ${formatDate(item.latestExpiry, "short")}`,
        action: "Review",
        href: "/staff",
      };
    default: {
      const unhandled: never = item;
      return unhandled;
    }
  }
}
