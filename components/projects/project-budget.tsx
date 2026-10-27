"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { Check, Download, FilePen, X } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { QueryBoundary } from "@/components/data/query-boundary";
import { useProjectId } from "@/components/projects/project-link";
import { VARIATION_STATUS } from "@/components/projects/project-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemTitle,
} from "@/components/ui/list";
import { Progress } from "@/components/ui/progress";
import { ListSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import type { VariationOrderDecision } from "@/lib/api/projects";
import type { BudgetLine, VariationOrder } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { downloadCsv, type CsvColumn } from "@/lib/csv";
import {
  formatCount,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatPercent,
  toISODate,
} from "@/lib/format";
import {
  projectQueries,
  useDecideVariationOrder,
  useProjectBudget,
  useVariationOrders,
} from "@/lib/queries/projects";

const MILLION = 1_000_000;

/** A project's money: the budget by cost code, and the changes waiting on it. */
export function ProjectBudget() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Budget by cost code</CardTitle>
          <CardDescription>₦ millions · committed means ordered or contracted</CardDescription>
          <CardAction>
            <QueryBoundary fallback={<ExportButton disabled />} errorFallback={() => null}>
              <ExportBudget />
            </QueryBoundary>
          </CardAction>
        </CardHeader>
        <QueryBoundary fallback={<TableSkeleton rows={9} columns={6} />}>
          <BudgetLines />
        </QueryBoundary>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variation orders</CardTitle>
          <CardDescription>Changes to scope or price that need sign-off</CardDescription>
        </CardHeader>
        <QueryBoundary fallback={<ListSkeleton rows={2} />}>
          <VariationOrderList />
        </QueryBoundary>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cost codes
// ---------------------------------------------------------------------------

const sum = (lines: BudgetLine[], field: "budget" | "committed" | "spent") =>
  lines.reduce((total, line) => total + line[field], 0);

/** ₦ millions, whole: the table's unit. The export keeps every naira. */
const millions = (amount: number) => formatNumber(amount / MILLION);

function totalOf(lines: BudgetLine[]): BudgetLine {
  return {
    code: "",
    name: "Total",
    budget: sum(lines, "budget"),
    committed: sum(lines, "committed"),
    spent: sum(lines, "spent"),
  };
}

function BudgetLines() {
  const { data: lines } = useProjectBudget(useProjectId());

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<FilePen />}
        title="No budget yet"
        description="The cost plan shows here, code by code, once it's entered."
        className="py-8"
      />
    );
  }

  const total = totalOf(lines);

  // Six figures a row: a table from the breakpoint up, a list on phones.
  return (
    <>
      <ul className="md:hidden">
        {[...lines, total].map((line) => (
          <li
            key={line.code || "total"}
            className={cn(
              "flex flex-col gap-2 border-b border-line px-4.5 py-3.5 last:border-b-0",
              !line.code && "border-t border-t-line-strong font-semibold",
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">
                {line.code && (
                  <span className="mr-2 font-mono text-sm text-ink-3">{line.code}</span>
                )}
                {line.name}
              </span>
              <SpentShare line={line} />
            </div>
            <Progress
              value={line.budget > 0 ? Math.round((line.spent / line.budget) * 100) : 0}
              aria-label={`${line.name}: ${spentShare(line)} of budget spent`}
            />
            <p className="text-sm font-normal text-ink-3 tabular-nums">
              Spent ₦{millions(line.spent)}m of ₦{millions(line.budget)}m · ₦
              {millions(line.committed)}m committed
            </p>
          </li>
        ))}
      </ul>

      <Table className="min-w-205 max-md:hidden">
        <TableHeader>
          <TableRow>
            <TableHead>Cost code</TableHead>
            <TableHead numeric>Budget</TableHead>
            <TableHead numeric>Committed</TableHead>
            <TableHead numeric>Spent</TableHead>
            <TableHead numeric>Uncommitted</TableHead>
            <TableHead className="w-[24%]">Spent of budget</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <BudgetRow key={line.code} line={line} />
          ))}
        </TableBody>
        <TableFooter>
          <BudgetRow line={total} />
        </TableFooter>
      </Table>
    </>
  );
}

const spentShare = (line: BudgetLine) =>
  formatPercent(line.budget > 0 ? line.spent / line.budget : 0);

/** The percentage, in danger when a line has spent more than its budget. */
function SpentShare({ line }: { line: BudgetLine }) {
  return (
    <span
      className={cn("shrink-0 text-sm tabular-nums", line.spent > line.budget && "text-danger")}
    >
      {spentShare(line)}
    </span>
  );
}

function BudgetRow({ line }: { line: BudgetLine }) {
  const uncommitted = line.budget - line.committed;
  return (
    <TableRow>
      <TableCell className="h-13">
        {line.code && <span className="mr-2 font-mono text-sm text-ink-3">{line.code}</span>}
        {line.name}
      </TableCell>
      <TableCell numeric title={formatMoney(line.budget)}>
        {millions(line.budget)}
      </TableCell>
      <TableCell numeric title={formatMoney(line.committed)}>
        {millions(line.committed)}
      </TableCell>
      <TableCell numeric className="font-medium" title={formatMoney(line.spent)}>
        {millions(line.spent)}
      </TableCell>
      <TableCell
        numeric
        className={cn("text-ink-2", uncommitted < 0 && "text-danger")}
        title={formatMoney(uncommitted)}
      >
        {millions(uncommitted)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          {/* The bar stops at full; the figure beside it doesn't, so an overspend shows. */}
          <Progress
            value={line.budget > 0 ? Math.round((line.spent / line.budget) * 100) : 0}
            aria-label={`${line.name}: ${spentShare(line)} of budget spent`}
            className="flex-1"
          />
          <span className="w-10 text-right">
            <SpentShare line={line} />
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

const BUDGET_COLUMNS: CsvColumn<BudgetLine>[] = [
  { header: "Code", value: (line) => line.code },
  { header: "Cost code", value: (line) => line.name },
  { header: "Budget (NGN)", value: (line) => line.budget },
  { header: "Committed (NGN)", value: (line) => line.committed },
  { header: "Spent (NGN)", value: (line) => line.spent },
  { header: "Uncommitted (NGN)", value: (line) => line.budget - line.committed },
];

function ExportButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button size="sm" {...props}>
      <Download />
      Export
    </Button>
  );
}

function ExportBudget() {
  const id = useProjectId();
  const [{ data: project }, { data: lines }] = useSuspenseQueries({
    queries: [projectQueries.detail(id), projectQueries.budget(id)],
  });
  return (
    <ExportButton
      disabled={lines.length === 0}
      onClick={() => {
        downloadCsv(
          `${project.code}-budget-${toISODate(new Date())}.csv`,
          [...lines, totalOf(lines)],
          BUDGET_COLUMNS,
        );
        toast.success(`Exported the ${project.name} budget`, {
          description: `${formatCount(lines.length, "cost code")} and the total, in naira.`,
        });
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Variation orders
// ---------------------------------------------------------------------------

function VariationOrderList() {
  const { data: orders } = useVariationOrders({ projectId: useProjectId() });
  const now = new Date();

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<FilePen />}
        title="No variation orders"
        description="Changes to scope or price raised on this project show here for sign-off."
        className="py-8"
      />
    );
  }

  return (
    <List>
      {orders.map((order) => (
        <VariationOrderItem key={order.id} order={order} now={now} />
      ))}
    </List>
  );
}

/** "+₦18,600,000 · +9 days" */
function impact(order: VariationOrder): string {
  const money = `${order.amount >= 0 ? "+" : ""}${formatMoney(order.amount)}`;
  return order.timeImpactDays > 0
    ? `${money} · +${formatCount(order.timeImpactDays, "day")}`
    : money;
}

function VariationOrderItem({ order, now }: { order: VariationOrder; now: Date }) {
  const [decision, setDecision] = useState<VariationOrderDecision>("approve");
  const [open, setOpen] = useState(false);
  const status = VARIATION_STATUS[order.status];

  // A dialog left open shouldn't greet you when you come back to this page
  // (it stays mounted while hidden), so close it as the page is hidden.
  useLayoutEffect(() => () => setOpen(false), []);

  const ask = (next: VariationOrderDecision) => {
    setDecision(next);
    setOpen(true);
  };

  const by =
    order.decidedBy && order.decidedAt
      ? `${status.label} by ${order.decidedBy.name} · ${formatDateTime(order.decidedAt, now)}`
      : `Raised by ${order.raisedBy.name} · ${formatDateTime(order.raisedAt, now)}`;

  return (
    <ListItem className="flex-wrap items-start gap-x-3 gap-y-2.5">
      <span className="mt-px font-mono text-sm text-ink-3">{order.code}</span>
      <ListItemContent className="flex-[1_1_16rem]">
        <ListItemTitle>{order.title}</ListItemTitle>
        <ListItemDescription>
          {by} · {impact(order)}
        </ListItemDescription>
      </ListItemContent>
      {order.status === "pending" ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => ask("reject")}>
            <X />
            Reject
          </Button>
          <Button size="sm" onClick={() => ask("approve")}>
            <Check />
            Approve
          </Button>
        </div>
      ) : (
        <Badge tone={status.tone}>{status.label}</Badge>
      )}
      <DecisionDialog order={order} decision={decision} open={open} onOpenChange={setOpen} />
    </ListItem>
  );
}

/**
 * Approving commits money, so it's confirmed first, and the dialog stays open
 * with the button busy until the server has agreed. If it refuses (someone
 * else decided first, say), the dialog stays put and says why.
 */
function DecisionDialog({
  order,
  decision,
  open,
  onOpenChange,
}: {
  order: VariationOrder;
  decision: VariationOrderDecision;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const decide = useDecideVariationOrder();
  const approving = decision === "approve";

  const confirm = () =>
    decide.mutate(
      { id: order.id, decision },
      {
        onSuccess: (updated) => {
          onOpenChange(false);
          toast.success(`${updated.code} ${approving ? "approved" : "rejected"}`, {
            description: updated.title,
          });
        },
        onError: (error) =>
          toast.error(`${order.code} wasn't ${approving ? "approved" : "rejected"}`, {
            description:
              error instanceof ApiError ? error.message : "Something went wrong. Try again.",
          }),
      },
    );

  return (
    <Dialog open={open} onOpenChange={(next) => !decide.isPending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {approving ? "Approve" : "Reject"} {order.code}?
          </DialogTitle>
          <DialogDescription>{order.title}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-md text-ink-2">
            {approving
              ? `It adds ${formatMoney(order.amount)} to the contract sum${
                  order.timeImpactDays > 0
                    ? ` and ${formatCount(order.timeImpactDays, "day")} to the programme`
                    : ""
                } of ${order.project.name}.`
              : `The change won't go ahead as ${order.raisedBy.name} raised it.`}{" "}
            This can&apos;t be undone.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={decide.isPending}>Cancel</Button>
          </DialogClose>
          <Button variant="primary" loading={decide.isPending} onClick={confirm}>
            {approving ? "Approve" : "Reject"} {order.code}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
