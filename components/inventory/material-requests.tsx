"use client";

import { ClipboardList } from "lucide-react";
import { DecisionButtons, decided, toastDecisionFailed } from "@/components/approvals/decision";
import { QueryBoundary } from "@/components/data/query-boundary";
import { formatQuantity, REQUEST_STATUS } from "@/components/inventory/inventory-status";
import { ProjectLink } from "@/components/projects/project-link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import type { MaterialRequest } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { daysBetween, formatDate, formatDateTime, formatRelativeDay } from "@/lib/format";
import { useDecideMaterialRequest, useMaterialRequests } from "@/lib/queries/inventory";
import { capitalize } from "@/lib/utils";

/**
 * The Requests tab: what sites have asked for, waiting ones first. A request
 * moves stock between the company's own stores rather than spending money
 * outside it, so it's decided in one click, without a confirmation.
 */
export function MaterialRequests() {
  return (
    <Card>
      <QueryBoundary fallback={<TableSkeleton rows={5} columns={6} />}>
        <RequestList />
      </QueryBoundary>
    </Card>
  );
}

const describe = (request: MaterialRequest) =>
  `${request.item.name} × ${formatQuantity(request.quantity, request.item.unit)}`;

function RequestList() {
  const { data: requests } = useMaterialRequests();
  const now = new Date();

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="No material requests"
        description="Requests raised from site with the field app show here for approval."
      />
    );
  }

  return (
    <>
      <ul className="md:hidden">
        {requests.map((request) => (
          <li
            key={request.id}
            className="flex flex-col gap-1 border-b border-line px-4.5 py-3.5 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium">{describe(request)}</span>
              <span className="mt-0.5 shrink-0 font-mono text-xs text-ink-3">{request.code}</span>
            </div>
            {request.note && <p className="text-sm text-ink-3">{request.note}</p>}
            <p className="text-sm text-ink-2">
              {request.project.name} · {request.requestedBy.name}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
              <NeededBy request={request} now={now} inline />
              <RequestDecision request={request} />
            </div>
          </li>
        ))}
      </ul>

      <Table className="min-w-240 max-md:hidden">
        <TableHeader>
          <TableRow>
            <TableHead>Request</TableHead>
            <TableHead>Item and quantity</TableHead>
            <TableHead>For site</TableHead>
            <TableHead>Requested by</TableHead>
            <TableHead>Needed by</TableHead>
            <TableHead className="text-right">Decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-mono text-sm text-ink-2">{request.code}</TableCell>
              <TableCell className="py-2.5">
                <div className="font-medium">{describe(request)}</div>
                {request.note && <div className="text-sm text-ink-3">{request.note}</div>}
              </TableCell>
              <TableCell>
                <ProjectLink project={request.project} className="font-normal" />
              </TableCell>
              <TableCell>
                <div>{request.requestedBy.name}</div>
                <div className="text-sm text-ink-3">{formatDateTime(request.requestedAt, now)}</div>
              </TableCell>
              <TableCell>
                <NeededBy request={request} now={now} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <RequestDecision request={request} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

/** The date, and for a waiting request how near it is: overdue in danger, today in warning. */
function NeededBy({
  request,
  now,
  inline = false,
}: {
  request: MaterialRequest;
  now: Date;
  inline?: boolean;
}) {
  const days = daysBetween(now, request.neededBy);
  const waiting = request.status === "pending";
  return (
    <div className={cn("text-md", inline && "flex gap-1.5 text-sm")}>
      <time dateTime={request.neededBy} className="tabular-nums">
        {inline && "Needed "}
        {formatDate(request.neededBy, "short")}
      </time>
      {waiting && (
        <div
          className={cn(
            "text-sm",
            days < 0 ? "text-danger" : days === 0 ? "text-warning" : "text-ink-3",
          )}
        >
          {inline ? "· " : ""}
          {capitalize(formatRelativeDay(request.neededBy, now))}
        </div>
      )}
    </div>
  );
}

function RequestDecision({ request }: { request: MaterialRequest }) {
  const decide = useDecideMaterialRequest();

  if (request.status !== "pending") {
    const status = REQUEST_STATUS[request.status];
    return (
      <Badge
        tone={status.tone}
        title={request.decidedBy ? `${status.label} by ${request.decidedBy.name}` : undefined}
      >
        {status.label}
      </Badge>
    );
  }

  return (
    <DecisionButtons
      pending={decide.isPending ? (decide.variables?.decision ?? null) : null}
      onDecide={(decision) =>
        decide.mutate(
          { id: request.id, decision },
          {
            onSuccess: (updated) =>
              toast.success(`${updated.code} ${decided(decision)}`, {
                description: `${describe(updated)} for ${updated.project.name}`,
              }),
            onError: (error) => toastDecisionFailed(request.code, decision, error),
          },
        )
      }
    />
  );
}
