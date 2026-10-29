"use client";

import { useRef, useState } from "react";
import {
  toPaymentInput,
  validatePayment,
  LIMITS,
  type PaymentDraft,
  type PaymentErrors,
} from "@/components/invoices/invoice-rules";
import { formatAmount, PAYMENT_METHOD } from "@/components/invoices/invoice-status";
import { Alert } from "@/components/ui/alert";
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
import { Field, focusFirstInvalid } from "@/components/ui/field";
import { Input, MoneyInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import type { InvoiceDetail, PaymentMethod } from "@/lib/api/types";
import { toISODate } from "@/lib/format";
import { useRecordPayment } from "@/lib/queries/invoices";

interface RecordPaymentDialogProps {
  invoice: InvoiceDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Money in against an invoice. Like every write that moves money, it waits
 * for the server; the dialog stays open (busy) until the payment is on the
 * books, and says why if the server refuses.
 */
export function RecordPaymentDialog({ invoice, open, onOpenChange }: RecordPaymentDialogProps) {
  const record = useRecordPayment();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (record.isPending ? undefined : onOpenChange(next))}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>
            {invoice.number} · {invoice.client.name} · {formatAmount(invoice.balance)} owed
          </DialogDescription>
        </DialogHeader>
        {/* The content unmounts when the dialog closes, so each payment starts afresh. */}
        <PaymentForm invoice={invoice} record={record} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({
  invoice,
  record,
  onDone,
}: {
  invoice: InvoiceDetail;
  record: ReturnType<typeof useRecordPayment>;
  onDone: () => void;
}) {
  const today = toISODate(new Date());
  const [draft, setDraft] = useState<PaymentDraft>({
    amount: String(invoice.balance),
    receivedOn: today,
    method: "bank_transfer",
    reference: "",
  });
  const [errors, setErrors] = useState<PaymentErrors>({});
  const [refusal, setRefusal] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);

  const update = <K extends keyof PaymentDraft>(key: K, value: PaymentDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setRefusal(null);
    const found = validatePayment(draft, {
      balance: invoice.balance,
      issuedOn: invoice.issuedOn,
      today,
    });
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      focusFirstInvalid(form.current ?? document);
      return;
    }
    const input = toPaymentInput(draft);
    record.mutate(
      { id: invoice.id, input },
      {
        onSuccess: (updated) => {
          onDone();
          toast.success(`${formatAmount(input.amount)} recorded against ${updated.number}`, {
            description:
              updated.status === "paid"
                ? "It's paid in full."
                : `${formatAmount(updated.balance)} still owed.`,
          });
        },
        onError: (error) =>
          setRefusal(
            error instanceof ApiError
              ? error.message
              : "The payment wasn't recorded. Check your connection and try again.",
          ),
      },
    );
  };

  return (
    <form ref={form} onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <DialogBody>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount received" required error={errors.amount}>
            <MoneyInput value={draft.amount} onValueChange={(value) => update("amount", value)} />
          </Field>
          <Field label="Date received" required error={errors.receivedOn}>
            <Input
              type="date"
              min={invoice.issuedOn}
              max={today}
              value={draft.receivedOn}
              onChange={(event) => update("receivedOn", event.target.value)}
            />
          </Field>
          <Field label="Paid by" required error={errors.method}>
            <Select
              value={draft.method}
              onChange={(event) => update("method", event.target.value as PaymentMethod)}
            >
              <option value="" disabled>
                Choose how it was paid
              </option>
              {Object.entries(PAYMENT_METHOD).map(([method, label]) => (
                <option key={method} value={method}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reference" error={errors.reference} hint="The bank's or the cheque's">
            <Input
              value={draft.reference}
              maxLength={LIMITS.paymentReference}
              onChange={(event) => update("reference", event.target.value)}
              className="font-mono"
            />
          </Field>
        </div>
        {refusal && (
          <Alert tone="danger" role="alert" title="The payment wasn't recorded">
            {refusal}
          </Alert>
        )}
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button disabled={record.isPending}>Cancel</Button>
        </DialogClose>
        <Button type="submit" variant="primary" loading={record.isPending}>
          Record payment
        </Button>
      </DialogFooter>
    </form>
  );
}
