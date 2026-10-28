"use client";

import { Check, X } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import type { Decision } from "@/lib/api/types";

/*
 * Approving and rejecting, the same way everywhere something waits for
 * sign-off: material requests, purchase orders, variation orders.
 *
 * Every decision waits for the server before the screen says it's done. Ones
 * that commit money ask first, in a dialog that stays open (busy) until the
 * server has agreed, and says why if it doesn't.
 */

/** "approved" / "rejected" */
export const decided = (decision: Decision) => (decision === "approve" ? "approved" : "rejected");

/** The error toast when the server refuses (most often a 409: someone decided first). */
export function toastDecisionFailed(code: string, decision: Decision, error: unknown) {
  toast.error(`${code} wasn't ${decided(decision)}`, {
    description: error instanceof ApiError ? error.message : "Something went wrong. Try again.",
  });
}

interface DecisionButtonsProps {
  onDecide: (decision: Decision) => void;
  /** The decision being sent, which shows it busy and holds the other. */
  pending?: Decision | null;
}

/** Reject and Approve, outlined: the screen's one filled button is for its main action. */
export function DecisionButtons({ onDecide, pending = null }: DecisionButtonsProps) {
  return (
    <div className="flex shrink-0 gap-2">
      <Button
        size="sm"
        onClick={() => onDecide("reject")}
        loading={pending === "reject"}
        disabled={pending !== null}
      >
        {pending !== "reject" && <X />}
        Reject
      </Button>
      <Button
        size="sm"
        onClick={() => onDecide("approve")}
        loading={pending === "approve"}
        disabled={pending !== null}
      >
        {pending !== "approve" && <Check />}
        Approve
      </Button>
    </div>
  );
}

/** Which decision a confirm-first item is asking about, and whether its dialog is open. */
export function useConfirmDecision() {
  const [decision, setDecision] = useState<Decision>("approve");
  const [open, setOpen] = useState(false);

  // A dialog left open shouldn't greet you when you come back to the page
  // (it stays mounted while hidden), so it closes as the page is hidden.
  useLayoutEffect(() => () => setOpen(false), []);

  const ask = (next: Decision) => {
    setDecision(next);
    setOpen(true);
  };
  return { decision, open, setOpen, ask };
}

interface ConfirmDecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: Decision;
  /** "PO-2026-0233" */
  code: string;
  /** What it is, under the title. */
  description: React.ReactNode;
  /** What deciding will do, in a sentence or two. "This can't be undone" is added. */
  consequence: React.ReactNode;
  pending: boolean;
  onConfirm: () => void;
}

export function ConfirmDecisionDialog({
  open,
  onOpenChange,
  decision,
  code,
  description,
  consequence,
  pending,
  onConfirm,
}: ConfirmDecisionDialogProps) {
  const verb = decision === "approve" ? "Approve" : "Reject";
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {verb} {code}?
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-md text-ink-2">{consequence} This can&apos;t be undone.</p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={pending}>Cancel</Button>
          </DialogClose>
          <Button variant="primary" loading={pending} onClick={onConfirm}>
            {verb} {code}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
