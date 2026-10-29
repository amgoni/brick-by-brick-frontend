import { LogoMark } from "@/components/brand/logo";
import { formatRate } from "@/components/invoices/invoice-status";
import type { CompanyDetails, InvoiceDetail } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";

/** What the page shows: an invoice, or a draft in the builder before it has a number. */
export interface InvoiceDocumentData {
  /** Null until the draft is first saved. */
  number: string | null;
  /** Marked as such, so a draft printed for a look can't pass for the real thing. */
  draft: boolean;
  client: string;
  clientReference: string | null;
  project: string | null;
  issuedOn: string;
  dueOn: string;
  lines: { key: string; description: string; quantity: number; unit: string; amount: number }[];
  subtotal: number;
  chargeVat: boolean;
  vatRate: number;
  vat: number;
  retentionRate: number;
  retention: number;
  total: number;
  notes: string | null;
}

export function documentFromInvoice(invoice: InvoiceDetail): InvoiceDocumentData {
  return {
    number: invoice.number,
    draft: invoice.status === "draft",
    client: invoice.client.name,
    clientReference: invoice.clientReference,
    project: invoice.project?.name ?? null,
    issuedOn: invoice.issuedOn,
    dueOn: invoice.dueOn,
    lines: invoice.lines.map((line) => ({ key: line.id, ...line })),
    subtotal: invoice.subtotal,
    chargeVat: invoice.chargeVat,
    vatRate: invoice.vatRate,
    vat: invoice.vat,
    retentionRate: invoice.retentionRate,
    retention: invoice.retention,
    total: invoice.total,
    notes: invoice.notes,
  };
}

/** On an invoice every amount carries its kobo: ₦46,500,000.00. */
const money = (amount: number) => formatMoney(amount, { kobo: true });

interface InvoiceDocumentProps {
  invoice: InvoiceDocumentData;
  company: CompanyDetails;
  /**
   * The builder's preview: company details not set yet show as [placeholders]
   * so it's clear something's missing. On the printed copy they're left out.
   */
  preview?: boolean;
  className?: string;
}

/**
 * The invoice as the client gets it: the builder's live preview and the page
 * that prints (and saves as a PDF). One component, so the two can't drift.
 */
export function InvoiceDocument({
  invoice,
  company,
  preview = false,
  className,
}: InvoiceDocumentProps) {
  const missing = (label: string) =>
    preview ? <span className="text-ink-3">[{label}]</span> : null;
  const companyLine = [
    company.address ?? missing("Company address"),
    company.rcNumber ? `RC ${company.rcNumber}` : missing("RC number"),
    company.tin ? `TIN ${company.tin}` : missing("TIN"),
  ].filter(Boolean);
  const number = invoice.number ?? "INV-…";
  const bank = company.bank;

  return (
    <article
      data-slot="invoice-document"
      className={cn(
        "flex flex-col gap-5 rounded-xl border border-line-strong bg-surface p-5 text-sm text-ink sm:p-7",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="flex items-center gap-2 text-base font-semibold">
            <LogoMark className="size-5.5" />
            {company.legalName ?? company.tradingName}
          </span>
          {companyLine.length > 0 && (
            <span className="text-ink-3">
              {companyLine.map((part, index) => (
                <span key={index}>
                  {index > 0 && " · "}
                  {part}
                </span>
              ))}
            </span>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xl font-semibold tracking-[0.04em]">
            {invoice.draft ? "DRAFT INVOICE" : "INVOICE"}
          </div>
          <div className="font-mono text-ink-2">{number}</div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium text-ink-3">Billed to</div>
          <div className="mt-1 font-medium">{invoice.client || missing("Client")}</div>
          {invoice.clientReference && (
            <div className="text-ink-3">Ref. {invoice.clientReference}</div>
          )}
        </div>
        <div className="min-w-0 text-right">
          <div className="text-xs font-medium text-ink-3">Issued · Due</div>
          <div className="mt-1 tabular-nums">
            {formatDate(invoice.issuedOn)} · {formatDate(invoice.dueOn)}
          </div>
          {invoice.project && <div className="text-ink-3">{invoice.project}</div>}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line text-left text-ink-3">
            <th className="py-2 pr-2.5 font-medium">Description</th>
            <th className="px-2.5 py-2 text-right font-medium">Qty</th>
            <th className="py-2 pl-2.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.key} className="border-b border-line align-top">
              <td className="py-2 pr-2.5 wrap-break-word">
                {line.description || missing("Description")}
              </td>
              <td className="px-2.5 py-2 text-right whitespace-nowrap tabular-nums">
                {formatNumber(line.quantity, { decimals: 2 })} {line.unit}
              </td>
              <td className="py-2 pl-2.5 text-right whitespace-nowrap tabular-nums">
                {money(line.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="flex w-full max-w-72 flex-col gap-1.5 self-end tabular-nums">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-3">Subtotal</dt>
          <dd>{money(invoice.subtotal)}</dd>
        </div>
        {invoice.chargeVat && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-3">VAT {formatRate(invoice.vatRate)}</dt>
            <dd>{money(invoice.vat)}</dd>
          </div>
        )}
        {invoice.retentionRate > 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-3">Retention {formatRate(invoice.retentionRate)}</dt>
            <dd>−{money(invoice.retention)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-line-strong pt-1.5 text-md font-semibold">
          <dt>Total due</dt>
          <dd>{money(invoice.total)}</dd>
        </div>
      </dl>

      {invoice.notes && <p className="whitespace-pre-line text-ink-2">{invoice.notes}</p>}

      <p className="border-t border-dashed border-line-strong pt-3.5 text-ink-2">
        {bank ? (
          <>
            Pay by transfer to {bank.name} · {bank.accountName} · {bank.accountNumber}.{" "}
          </>
        ) : (
          preview && (
            <>
              Pay by transfer to {missing("Bank")} · {missing("Account name")} ·{" "}
              {missing("Account number")}.{" "}
            </>
          )
        )}
        Quote <span className="font-mono">{number}</span> as the reference.
      </p>
    </article>
  );
}
