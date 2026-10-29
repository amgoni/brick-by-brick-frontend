"use client";

import { useSuspenseQueries } from "@tanstack/react-query";
import { FileDown, Lock, Plus, SearchX, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { describeError, QueryBoundary } from "@/components/data/query-boundary";
import { useRouteParam } from "@/components/data/route-params";
import { InvoiceDocument, type InvoiceDocumentData } from "@/components/invoices/invoice-document";
import {
  addDays,
  DATE_WINDOW_DAYS,
  draftFromInvoice,
  emptyDraft,
  hasErrors,
  LIMITS,
  newLine,
  previewTotals,
  projectsFor,
  sameDraft,
  toInvoiceInput,
  validateInvoice,
  type InvoiceDraft,
  type InvoiceErrors,
  type LineField,
} from "@/components/invoices/invoice-rules";
import { formatRate, formatTerms, InvoiceStatusBadge } from "@/components/invoices/invoice-status";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ErrorState } from "@/components/ui/error-state";
import { Field, focusFirstInvalid } from "@/components/ui/field";
import { Input, MoneyInput, NumberInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import type { Client, InvoiceDetail, InvoicingSettings, Project } from "@/lib/api/types";
import { formatDate, formatMoney, formatTime, toISODate } from "@/lib/format";
import { clientQueries } from "@/lib/queries/clients";
import { invoiceQueries, useSaveInvoice, useSendInvoice } from "@/lib/queries/invoices";
import { projectQueries } from "@/lib/queries/projects";
import { parseNumber } from "@/lib/utils";

const INVOICES_CRUMB = { label: "Invoices", href: "/invoices" };

/** On an invoice every amount carries its kobo: ₦46,500,000.00. */
const money = (amount: number) => formatMoney(amount, { kobo: true });

/**
 * The invoice builder: a new invoice (/invoices/new), or a draft carried on
 * (/invoices/:id/edit). Saving keeps it a draft; sending it is the one-way
 * step, so it asks first.
 */
export function InvoiceBuilder({ mode }: { mode: "new" | "edit" }) {
  return (
    <QueryBoundary
      fallback={<BuilderSkeleton title={mode === "new" ? "New invoice" : null} />}
      errorFallback={({ error, retry }) =>
        error instanceof ApiError && error.status === 404 ? (
          <InvoiceMissing />
        ) : (
          <>
            <PageHeader
              breadcrumb={<Breadcrumb items={[INVOICES_CRUMB, { label: "Invoice" }]} />}
              title="Invoice"
            />
            <Card>
              <ErrorState description={describeError(error)} onRetry={retry} />
            </Card>
          </>
        )
      }
    >
      {mode === "new" ? <NewInvoice /> : <EditInvoice />}
    </QueryBoundary>
  );
}

function BuilderSkeleton({ title }: { title: string | null }) {
  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[INVOICES_CRUMB, { label: title ?? <Skeleton className="h-4 w-28" /> }]}
          />
        }
        title={title ?? <Skeleton className="my-0.5 h-6.5 w-72 max-w-full" />}
      />
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[3_1_37.5rem] flex-col gap-4">
          {[3, 2, 4].map((rows, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-4.5 w-32" />
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: rows }, (_, row) => (
                  <div key={row} className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-control" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex min-w-0 flex-[2_1_23.75rem] flex-col gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-120 rounded-xl" />
        </div>
      </div>
    </>
  );
}

function InvoiceMissing() {
  return (
    <>
      <PageHeader
        breadcrumb={<Breadcrumb items={[INVOICES_CRUMB, { label: "Not found" }]} />}
        title="Invoice not found"
      />
      <Card>
        <EmptyState
          icon={<SearchX />}
          title="There's no invoice here"
          description="It may have been mistyped, or the link is out of date."
          action={
            <Button size="sm" asChild>
              <Link href="/invoices">Back to invoices</Link>
            </Button>
          }
        />
      </Card>
    </>
  );
}

function NewInvoice() {
  const [{ data: clients }, { data: projects }, { data: settings }] = useSuspenseQueries({
    queries: [clientQueries.list(), projectQueries.list(), invoiceQueries.settings()],
  });
  // The page stays mounted after it's left (see AGENTS.md), so once an invoice
  // is created the form starts over for the next one.
  const [round, setRound] = useState(0);
  return (
    <BuilderForm
      key={round}
      invoice={null}
      clients={clients}
      projects={projects}
      settings={settings}
      onCreated={() => setRound((current) => current + 1)}
    />
  );
}

function EditInvoice() {
  const id = useRouteParam("id");
  const [{ data: clients }, { data: projects }, { data: settings }, { data: invoice }] =
    useSuspenseQueries({
      queries: [
        clientQueries.list(),
        projectQueries.list(),
        invoiceQueries.settings(),
        invoiceQueries.detail(id),
      ],
    });
  if (invoice.status !== "draft") return <AlreadySent invoice={invoice} />;
  return (
    <BuilderForm
      key={invoice.id}
      invoice={invoice}
      clients={clients}
      projects={projects}
      settings={settings}
    />
  );
}

/** Someone followed an edit link to an invoice that's gone out since. */
function AlreadySent({ invoice }: { invoice: InvoiceDetail }) {
  return (
    <>
      <PageHeader
        breadcrumb={<Breadcrumb items={[INVOICES_CRUMB, { label: invoice.number }]} />}
        title={<InvoiceTitle number={invoice.number} />}
        status={<InvoiceStatusBadge invoice={invoice} />}
      />
      <Card>
        <EmptyState
          icon={<Lock />}
          title={`${invoice.number} has been sent`}
          description="A sent invoice can't be changed. Payments and reminders are recorded against it from the invoice list."
          action={
            <Button size="sm" asChild>
              <Link href={`/invoices?invoice=${invoice.id}`}>View invoice</Link>
            </Button>
          }
        />
      </Card>
    </>
  );
}

function InvoiceTitle({ number }: { number: string }) {
  return (
    <>
      Invoice <span className="font-mono text-2xl font-medium">{number}</span>
    </>
  );
}

interface BuilderFormProps {
  /** The draft being carried on; null for a new invoice. */
  invoice: InvoiceDetail | null;
  clients: Client[];
  projects: Project[];
  settings: InvoicingSettings;
  onCreated?: () => void;
}

function BuilderForm({ invoice, clients, projects, settings, onCreated }: BuilderFormProps) {
  const router = useRouter();
  const save = useSaveInvoice();
  const sendInvoice = useSendInvoice();
  const today = toISODate(new Date());

  const [draft, setDraft] = useState(() =>
    invoice ? draftFromInvoice(invoice) : emptyDraft(settings, today),
  );
  // The draft as the server last saw it, to tell whether there's anything to save.
  const [baseline, setBaseline] = useState(draft);
  const [saved, setSaved] = useState(
    invoice && { id: invoice.id, number: invoice.number, at: null as Date | null },
  );
  const [errors, setErrors] = useState<InvoiceErrors>({});
  const [refusal, setRefusal] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);

  const dirty = !sameDraft(draft, baseline);
  const busy = save.isPending || sendInvoice.isPending;
  const client = clients.find((entry) => entry.id === draft.clientId);
  const projectOptions = projectsFor(client, projects);
  const project = projects.find((entry) => entry.id === draft.projectId);
  const totals = previewTotals(draft, settings.vatRate);
  const dueOn = draft.issuedOn ? addDays(draft.issuedOn, Number(draft.paymentTermsDays)) : null;

  // The page stays mounted when it's left; the send dialog shouldn't be open on return.
  useLayoutEffect(() => () => setConfirming(false), []);

  const update = <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    // A field's message goes as soon as it's being fixed.
    setErrors((current) =>
      key in current && current[key as keyof InvoiceErrors]
        ? { ...current, [key]: undefined }
        : current,
    );
  };

  const updateLine = (key: string, field: LineField, value: string) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.key === key ? { ...line, [field]: value } : line)),
    }));
    setErrors((current) => {
      const lineErrors = current.lines?.[key];
      if (!lineErrors?.[field]) return current;
      return {
        ...current,
        lines: { ...current.lines, [key]: { ...lineErrors, [field]: undefined } },
      };
    });
  };

  const addLine = () => {
    const line = newLine();
    setDraft((current) => ({ ...current, lines: [...current.lines, line] }));
    // The click's render lands before the next frame; then the new line takes the cursor.
    requestAnimationFrame(() => document.getElementById(`${line.key}-description`)?.focus());
  };

  const removeLine = (key: string) =>
    setDraft((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.key !== key),
    }));

  /*
   * Picking a client fills in what follows from it: where the invoice goes
   * (unless someone typed another address), the project if there's only one,
   * and the tax. A building contract carries VAT; a home sale carries neither
   * VAT nor retention.
   */
  const chooseClient = (clientId: string) => {
    const next = clients.find((entry) => entry.id === clientId);
    const previous = client;
    const options = projectsFor(next, projects);
    setDraft((current) => ({
      ...current,
      clientId,
      sendTo:
        !current.sendTo.trim() || current.sendTo === previous?.email
          ? (next?.email ?? "")
          : current.sendTo,
      projectId: options.some((entry) => entry.id === current.projectId)
        ? current.projectId
        : options.length === 1
          ? (options[0]?.id ?? "")
          : "",
      chargeVat: next?.kind !== "buyer",
      retentionRate: next?.kind === "buyer" ? "0" : current.retentionRate,
    }));
    setErrors((current) => ({ ...current, clientId: undefined, sendTo: undefined }));
  };

  /** Checks the whole draft; on a problem, says where and takes the cursor there. */
  const check = () => {
    setRefusal(null);
    const found = validateInvoice(draft, { today });
    setErrors(found);
    if (hasErrors(found)) {
      focusFirstInvalid(form.current ?? document);
      return false;
    }
    return true;
  };

  /** Saves the draft as it stands: the first save creates (and numbers) it. */
  const persist = async () => {
    const result = await save.mutateAsync({ id: saved?.id ?? null, input: toInvoiceInput(draft) });
    setBaseline(draft);
    setSaved({ id: result.id, number: result.number, at: new Date() });
    return result;
  };

  /** A new invoice moves to its own address once it exists, and the new-invoice form starts over. */
  const settleNew = (id: string) => {
    if (invoice) return;
    onCreated?.();
    router.replace(`/invoices/${id}/edit`);
  };

  const refused = (error: unknown) =>
    error instanceof ApiError
      ? error.message
      : "It wasn't saved. Check your connection and try again.";

  const saveDraft = async () => {
    if (!check()) return;
    try {
      const result = await persist();
      toast.success(invoice ? "Draft saved" : `${result.number} saved as a draft`);
      settleNew(result.id);
    } catch (error) {
      setRefusal(refused(error));
    }
  };

  const openPdf = async () => {
    if (saved && !dirty) {
      window.open(`/invoices/${saved.id}/print`, "_blank", "noopener");
      return;
    }
    if (!check()) return;
    // Opened now, while the click still counts as the user's, or a popup
    // blocker stops it; it's pointed at the PDF once the draft is saved.
    const tab = window.open("", "_blank");
    try {
      const result = await persist();
      if (tab) {
        tab.opener = null;
        tab.location.href = `/invoices/${result.id}/print`;
      }
      settleNew(result.id);
    } catch (error) {
      tab?.close();
      setRefusal(refused(error));
    }
  };

  const askToSend = () => {
    if (!check()) return;
    setSendError(null);
    setConfirming(true);
  };

  const send = async () => {
    setSendError(null);
    try {
      const current = saved && !dirty ? saved : await persist();
      const sent = await sendInvoice.mutateAsync(current.id);
      setConfirming(false);
      toast.success(`${sent.number} sent to ${sent.sendTo}`, {
        description: `${money(sent.total)}, due ${formatDate(sent.dueOn)}`,
      });
      onCreated?.();
      router.push(`/invoices?invoice=${sent.id}`);
    } catch (error) {
      setSendError(
        error instanceof ApiError
          ? error.message
          : "It wasn't sent. Check your connection and try again.",
      );
    }
  };

  const subline = (() => {
    if (!saved) return "Not saved yet. It gets its number when you first save it.";
    const created = invoice?.activity.at(-1);
    const state = saved.at
      ? `Draft saved at ${formatTime(saved.at)}`
      : created
        ? `Draft created ${formatDate(created.at, "short")} by ${invoice?.createdBy.name}`
        : "Draft";
    return `${state} · ${dirty ? "unsaved changes" : "not yet sent"}`;
  })();

  const preview: InvoiceDocumentData = {
    number: saved?.number ?? null,
    draft: true,
    client: client?.name ?? "",
    clientReference: draft.clientReference.trim() || null,
    project: project?.name ?? null,
    issuedOn: draft.issuedOn || today,
    dueOn: dueOn ?? today,
    lines: draft.lines.map((line, index) => ({
      key: line.key,
      description: line.description,
      quantity: parseNumber(line.quantity) ?? 0,
      unit: line.unit,
      amount: totals.amounts[index] ?? 0,
    })),
    subtotal: totals.subtotal,
    chargeVat: draft.chargeVat,
    vatRate: settings.vatRate,
    vat: totals.vat,
    retentionRate: Number(draft.retentionRate),
    retention: totals.retention,
    total: totals.total,
    notes: draft.notes.trim() || null,
  };
  const { company } = settings;
  const companyIncomplete = !company.address || !company.rcNumber || !company.tin || !company.bank;

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb items={[INVOICES_CRUMB, { label: saved?.number ?? "New invoice" }]} />
        }
        title={saved ? <InvoiceTitle number={saved.number} /> : "New invoice"}
        status={<Badge tone="neutral">Draft</Badge>}
        description={subline}
        actions={
          <>
            <Button
              onClick={saveDraft}
              loading={save.isPending && !confirming}
              disabled={busy || (saved !== null && !dirty)}
            >
              Save draft
            </Button>
            <Button onClick={openPdf} disabled={busy}>
              <FileDown />
              PDF
            </Button>
            <Button variant="primary" onClick={askToSend} disabled={busy}>
              <Send />
              Send invoice
            </Button>
          </>
        }
      />

      {refusal && (
        <Alert tone="danger" role="alert" title="The draft wasn't saved">
          {refusal}
        </Alert>
      )}

      <div className="flex flex-wrap items-start gap-4">
        <form
          ref={form}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void saveDraft();
          }}
          className="flex min-w-0 flex-[3_1_37.5rem] flex-col gap-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Billed to</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Client" required error={errors.clientId}>
                <Select
                  value={draft.clientId}
                  onChange={(event) => chooseClient(event.target.value)}
                >
                  <option value="" disabled>
                    Choose a client
                  </option>
                  {(["contract", "buyer"] as const).map((kind) => (
                    <optgroup
                      key={kind}
                      label={kind === "contract" ? "Contract clients" : "Property buyers"}
                    >
                      {clients
                        .filter((entry) => entry.kind === kind)
                        .map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>
              <Field
                label="Project"
                hint={
                  client?.kind === "buyer"
                    ? "The development the home is in."
                    : client && projectOptions.length === 0
                      ? `No projects for ${client.name}.`
                      : undefined
                }
              >
                <Select
                  value={draft.projectId}
                  disabled={!client}
                  onChange={(event) => update("projectId", event.target.value)}
                >
                  <option value="">{client ? "No project" : "Choose a client first"}</option>
                  {projectOptions.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="What it's for"
                required
                error={errors.reference}
                hint="Shown in the invoice list."
              >
                <Input
                  value={draft.reference}
                  maxLength={LIMITS.reference}
                  placeholder="Valuation 4, or Unit B-07, instalment 3 of 4"
                  onChange={(event) => update("reference", event.target.value)}
                />
              </Field>
              <Field label="Send to" required error={errors.sendTo}>
                <Input
                  type="email"
                  autoComplete="off"
                  value={draft.sendTo}
                  maxLength={LIMITS.sendTo}
                  onChange={(event) => update("sendTo", event.target.value)}
                />
              </Field>
              <Field label="Client PO / reference" error={errors.clientReference}>
                <Input
                  value={draft.clientReference}
                  maxLength={LIMITS.clientReference}
                  placeholder="Their order number, if they gave one"
                  className="font-mono placeholder:font-sans"
                  onChange={(event) => update("clientReference", event.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dates &amp; terms</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field label="Issue date" required error={errors.issuedOn}>
                <Input
                  type="date"
                  min={addDays(today, -DATE_WINDOW_DAYS)}
                  max={addDays(today, DATE_WINDOW_DAYS)}
                  value={draft.issuedOn}
                  onChange={(event) => update("issuedOn", event.target.value)}
                />
              </Field>
              <Field label="Payment terms">
                <Select
                  value={draft.paymentTermsDays}
                  onChange={(event) => update("paymentTermsDays", event.target.value)}
                >
                  {settings.paymentTerms.map((days) => (
                    <option key={days} value={String(days)}>
                      {formatTerms(days)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Due date" hint="The issue date plus the terms.">
                <Input readOnly value={dueOn ? formatDate(dueOn) : "—"} className="tabular-nums" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
              <CardDescription>Quantity × rate, each to the kobo.</CardDescription>
            </CardHeader>
            <ol className="@container">
              {draft.lines.map((line, index) => {
                const lineErrors = errors.lines?.[line.key] ?? {};
                const labelId = `${line.key}-label`;
                return (
                  <li
                    key={line.key}
                    role="group"
                    aria-labelledby={labelId}
                    className="flex flex-col gap-3 border-b border-line px-4.5 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span id={labelId} className="text-sm font-medium text-ink-3">
                        Line {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={draft.lines.length === 1}
                        onClick={() => removeLine(line.key)}
                        aria-label={`Remove line ${index + 1}`}
                      >
                        <Trash2 />
                        Remove
                      </Button>
                    </div>
                    <Field
                      label="Description"
                      htmlFor={`${line.key}-description`}
                      error={lineErrors.description}
                    >
                      <Input
                        value={line.description}
                        maxLength={LIMITS.description}
                        onChange={(event) =>
                          updateLine(line.key, "description", event.target.value)
                        }
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3 @lg:grid-cols-[6rem_6.5rem_minmax(0,1fr)_minmax(0,1fr)]">
                      <Field label="Quantity" error={lineErrors.quantity}>
                        <NumberInput
                          value={line.quantity}
                          decimals={2}
                          onValueChange={(value) => updateLine(line.key, "quantity", value)}
                        />
                      </Field>
                      <Field label="Unit" error={lineErrors.unit}>
                        <Input
                          value={line.unit}
                          maxLength={LIMITS.unit}
                          onChange={(event) => updateLine(line.key, "unit", event.target.value)}
                        />
                      </Field>
                      <Field label="Rate" error={lineErrors.rate}>
                        <MoneyInput
                          value={line.rate}
                          onValueChange={(value) => updateLine(line.key, "rate", value)}
                        />
                      </Field>
                      <Field label="Amount">
                        <Input
                          readOnly
                          tabIndex={-1}
                          value={money(totals.amounts[index] ?? 0)}
                          className="text-right tabular-nums"
                        />
                      </Field>
                    </div>
                  </li>
                );
              })}
            </ol>
            <CardFooter className="border-t-0">
              <Button size="sm" onClick={addLine} disabled={draft.lines.length >= LIMITS.lines}>
                <Plus />
                Add line
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax, retention &amp; notes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-line px-3.5 py-2.5 md:col-span-2">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="charge-vat">Charge VAT at {formatRate(settings.vatRate)}</Label>
                  <span className="text-xs text-ink-3">
                    Building work carries VAT; the sale of a home doesn&rsquo;t.
                  </span>
                </div>
                <Switch
                  id="charge-vat"
                  checked={draft.chargeVat}
                  onCheckedChange={(checked) => update("chargeVat", checked)}
                />
              </div>
              <Field label="Retention held by the client" hint="Released at handover.">
                <Select
                  value={draft.retentionRate}
                  onChange={(event) => update("retentionRate", event.target.value)}
                >
                  {settings.retentionRates.map((rate) => (
                    <option key={rate} value={String(rate)}>
                      {rate === 0 ? "None" : `${formatRate(rate)} of the subtotal`}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Notes on the invoice"
                className="md:col-span-2"
                error={errors.notes}
                hint={`${draft.notes.length} of ${LIMITS.notes} characters`}
              >
                <Textarea
                  value={draft.notes}
                  maxLength={LIMITS.notes}
                  placeholder="Who certified the valuation, when retention is released…"
                  onChange={(event) => update("notes", event.target.value)}
                />
              </Field>
            </CardContent>
          </Card>
        </form>

        <aside
          aria-label="Totals and preview"
          className="flex min-w-0 flex-[2_1_23.75rem] flex-col gap-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-2.5 text-md tabular-nums">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Subtotal</dt>
                  <dd>{money(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">
                    {draft.chargeVat ? `VAT ${formatRate(settings.vatRate)}` : "No VAT"}
                  </dt>
                  <dd>{money(totals.vat)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">
                    {Number(draft.retentionRate) > 0
                      ? `Less retention ${formatRate(Number(draft.retentionRate))}`
                      : "No retention"}
                  </dt>
                  <dd>
                    {totals.retention > 0 && "−"}
                    {money(totals.retention)}
                  </dd>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line pt-3">
                  <dt className="font-semibold">Total due</dt>
                  {/* A lone headline figure: proportional digits. */}
                  <dd className="text-2xl font-semibold tracking-[-0.01em] [font-variant-numeric:normal]">
                    {money(totals.total)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <section aria-label="Invoice preview" className="flex flex-col gap-3">
            <InvoiceDocument invoice={preview} company={company} preview />
            {companyIncomplete && (
              <Alert tone="info">
                <p>
                  Your address, RC number, TIN and bank details aren&rsquo;t on your invoices yet.
                  They&rsquo;re set under{" "}
                  <Link href="/settings" className="text-accent underline-offset-4 hover:underline">
                    Settings
                  </Link>
                  .
                </p>
              </Alert>
            )}
          </section>
        </aside>
      </div>

      <Dialog open={confirming} onOpenChange={(open) => !busy && setConfirming(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send {saved?.number ?? "this invoice"}?</DialogTitle>
            <DialogDescription>
              {money(totals.total)} to {client?.name}, due {dueOn ? formatDate(dueOn) : "—"}.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-md text-ink-2">
              It&rsquo;s emailed to <span className="text-ink">{draft.sendTo.trim()}</span> as a
              PDF. Once it&rsquo;s sent it can&rsquo;t be changed; it&rsquo;s chased and paid from
              the invoice list.
            </p>
            {sendError && (
              <Alert tone="danger" role="alert" title="It wasn't sent">
                {sendError}
              </Alert>
            )}
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={busy}>Cancel</Button>
            </DialogClose>
            <Button variant="primary" onClick={send} loading={busy}>
              {!busy && <Send />}
              Send invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
