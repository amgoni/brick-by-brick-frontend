"use client";

import {
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Clock,
  FilePen,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { List, ListItem, ListItemIcon } from "@/components/ui/list";
import { ListSkeleton } from "@/components/ui/skeleton";
import type { ApprovalKind } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";
import { useDashboardSummary } from "@/lib/queries/dashboard";

const APPROVALS: { kind: ApprovalKind; label: string; icon: LucideIcon; href: string }[] = [
  { kind: "material_request", label: "Material requests", icon: ClipboardList, href: "/inventory" },
  { kind: "timesheet", label: "Timesheets", icon: Clock, href: "/staff" },
  { kind: "purchase_order", label: "Purchase orders", icon: ShoppingCart, href: "/inventory" },
  { kind: "variation_order", label: "Variation orders", icon: FilePen, href: "/projects" },
];

export function ApprovalsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Waiting for your approval</CardTitle>
        <CardAction>
          <QueryBoundary fallback={null} errorFallback={() => null}>
            <ApprovalTotal />
          </QueryBoundary>
        </CardAction>
      </CardHeader>
      <QueryBoundary fallback={<ListSkeleton rows={4} />}>
        <ApprovalList />
      </QueryBoundary>
    </Card>
  );
}

function ApprovalTotal() {
  const { data } = useDashboardSummary();
  const total = Object.values(data.approvals).reduce((sum, count) => sum + count, 0);
  return total > 0 ? <Badge tone="info">{formatNumber(total)}</Badge> : null;
}

function ApprovalList() {
  const { data } = useDashboardSummary();
  const waiting = APPROVALS.filter((approval) => data.approvals[approval.kind] > 0);

  if (waiting.length === 0) {
    return <EmptyState icon={<CircleCheck />} title="You're all caught up" className="py-8" />;
  }

  return (
    <List>
      {waiting.map((approval) => (
        <ListItem key={approval.kind} href={approval.href}>
          <ListItemIcon>
            <approval.icon />
          </ListItemIcon>
          <span className="flex-1 text-md font-medium">{approval.label}</span>
          <span className="text-ink-2 tabular-nums">
            {formatNumber(data.approvals[approval.kind])}
          </span>
          <ChevronRight className="text-ink-3" />
        </ListItem>
      ))}
    </List>
  );
}
