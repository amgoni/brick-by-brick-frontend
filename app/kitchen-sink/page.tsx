import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/cn";
import {
  formatCount,
  formatDate,
  formatDateTime,
  formatMoney,
  formatMoneyCompact,
  formatPercent,
  formatRelativeDay,
  formatTime,
} from "@/lib/format";
import { ComponentShowcase, OverlayShowcase } from "./showcase";

export const metadata: Metadata = {
  title: "Kitchen sink",
};

/**
 * Every token and primitive on one page, laid out like the Foundations board
 * of the design export, so a change to the design system can be checked in
 * both themes at a glance.
 */

const PRINCIPLES = [
  ["Outline first", "Cards, inputs, chips and badges are 1px borders on white."],
  [
    "One filled button",
    "Navy fill marks the primary action. Everything else is outlined or ghost.",
  ],
  ["Status is colour + words", "Every badge carries a label, never colour alone."],
  ["Numbers line up", "Tabular figures for money and quantities; Geist Mono for codes."],
] as const;

const TOKENS = [
  ["Surface", "bg-surface"],
  ["Surface muted", "bg-surface-muted"],
  ["Hover", "bg-hover"],
  ["Ink", "bg-ink"],
  ["Ink 2", "bg-ink-2"],
  ["Ink 3", "bg-ink-3"],
  ["Line", "bg-line"],
  ["Line strong", "bg-line-strong"],
  ["Primary", "bg-primary"],
  ["On primary", "bg-on-primary"],
  ["Accent", "bg-accent"],
  ["Data", "bg-data"],
  ["Success", "bg-success"],
  ["Warning", "bg-warning"],
  ["Danger", "bg-danger"],
  ["Focus ring", "bg-ring"],
] as const;

const TYPE_SCALE = [
  ["Display · 5xl/600", "text-5xl font-semibold", "Foundations"],
  // Proportional digits on a lone figure; tabular-nums is for columns.
  ["KPI figure · 4xl/600", "text-4xl font-semibold", formatMoney(412_600_000)],
  ["Page title · 3xl/600", "text-3xl font-semibold", "Lekki Palms Residences"],
  ["Stat value · 2xl/600", "text-2xl font-semibold", formatMoneyCompact(98_900_000)],
  ["Panel title · xl/600", "text-xl font-semibold", "Excavator 20t"],
  ["Lead · lg", "text-lg text-ink-2", "Here's where things stand across 5 active sites."],
  ["Section · base/600", "text-base font-semibold", "Needs attention"],
  ["Body · base", "text-base text-ink-2", "Blockwork on level 5 at 70%. Lost two hours to rain."],
  ["Control · md/500", "text-md font-medium", "Export report"],
  ["Meta · sm", "text-sm text-ink-3", "Chinedu Eze · 48 on site · Yesterday, 4:52 PM"],
  ["Label · caps", "caps text-ink-3", "Operations"],
  ["Code · mono sm", "font-mono text-sm text-ink-2", "INV-2026-0149 · EQ-004 · LPR-STR-201"],
] as const;

// A fixed "now", so the page renders the same everywhere and stays static.
const NOW = "2026-10-26T09:00:00+01:00";

const FORMATS = [
  ["formatMoney(412600000)", formatMoney(412_600_000)],
  ["formatMoney(1234.5, { kobo: true })", formatMoney(1234.5, { kobo: true })],
  ["formatMoneyCompact(8660000000)", formatMoneyCompact(8_660_000_000)],
  ["formatMoneyCompact(412600000)", formatMoneyCompact(412_600_000)],
  ["formatMoneyCompact(999950000)", formatMoneyCompact(999_950_000)],
  ["formatPercent(0.4775)", formatPercent(0.4775)],
  ["formatCount(2, 'person', 'people')", formatCount(2, "person", "people")],
  ["formatDate(d, 'full')", formatDate(NOW, "full")],
  ["formatDate(d)", formatDate(NOW)],
  ["formatTime(…)", formatTime("2026-10-25T16:52:00+01:00")],
  ["formatDateTime(…, now)", formatDateTime("2026-10-25T16:52:00+01:00", NOW)],
  ["formatRelativeDay(…, now)", formatRelativeDay("2026-10-14T12:00:00+01:00", NOW)],
] as const;

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="caps text-ink-3">{caption}</span>
      </div>
      {children}
    </section>
  );
}

/** Forces its subtree into one theme: the tokens are re-declared on `[data-theme]`. */
function Panel({
  theme,
  className,
  children,
}: {
  theme?: "light" | "dark";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme={theme}
      className={cn(
        "flex min-w-0 flex-col gap-5 rounded-2xl border border-line bg-surface p-5 text-ink md:p-7",
        className,
      )}
    >
      {theme && <span className="caps text-ink-3">{theme === "light" ? "Light" : "Dark"}</span>}
      {children}
    </div>
  );
}

export default function KitchenSinkPage() {
  return (
    <main className="mx-auto flex w-full max-w-content flex-col gap-14 px-4 py-10 md:px-10 md:py-16 xl:px-20">
      <header className="flex flex-col gap-8 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <ThemeToggle />
          </div>
          <h1 className="text-5xl font-semibold">Kitchen sink</h1>
          <p className="max-w-[62ch] text-lg text-ink-2">
            White and navy. Lines do the work: borders define every surface, and solid fill is kept
            for the one primary action on a screen and for data.
          </p>
        </div>
        <dl className="grid max-w-132 gap-x-8 gap-y-3 text-md sm:grid-cols-2">
          {PRINCIPLES.map(([title, body]) => (
            <div key={title}>
              <dt className="font-semibold">{title}</dt>
              <dd className="text-ink-3">{body}</dd>
            </div>
          ))}
        </dl>
      </header>

      <Section title="Colour tokens" caption="Light · dark">
        <div className="grid gap-6 xl:grid-cols-2">
          {(["light", "dark"] as const).map((theme) => (
            <Panel key={theme} theme={theme}>
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-4 2xl:grid-cols-6">
                {TOKENS.map(([name, className]) => (
                  <div key={name} className="flex min-w-0 flex-col gap-1.5">
                    <div className={cn("h-14 rounded-[10px] border border-line", className)} />
                    <span className="text-sm font-medium">{name}</span>
                    <span className="truncate font-mono text-2xs text-ink-3">{className}</span>
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      </Section>

      <Section title="Type · Geist & Geist Mono" caption="Size / weight">
        <Panel>
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-[11rem_minmax(0,1fr)] md:items-baseline">
            {TYPE_SCALE.map(([label, className, sample]) => (
              <div key={label} className="contents">
                <span className="font-mono text-xs text-ink-3">{label}</span>
                <span className={cn("min-w-0 wrap-break-word", className)}>{sample}</span>
              </div>
            ))}
          </div>
        </Panel>
      </Section>

      <Section title="Components" caption="Same markup, two themes">
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel theme="light">
            <ComponentShowcase />
          </Panel>
          <Panel theme="dark">
            <ComponentShowcase />
          </Panel>
        </div>
      </Section>

      <Section title="Overlays" caption="Follow the page theme">
        <Panel>
          <OverlayShowcase />
        </Panel>
      </Section>

      <Section title="Formatting" caption="lib/format.ts">
        <Panel>
          <dl className="grid gap-x-6 gap-y-3 text-md md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            {FORMATS.map(([call, result]) => (
              <div key={call} className="contents">
                <dt className="font-mono text-sm text-ink-3">{call}</dt>
                <dd className="tabular-nums">{result}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </Section>
    </main>
  );
}
