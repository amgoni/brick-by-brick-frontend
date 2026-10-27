/**
 * Display formatting. Everything that turns a number or a date into text on a
 * screen goes through here, so ₦ amounts, percentages and dates read the same
 * on every page.
 *
 * Locale and time zone are pinned, not taken from the browser. The server
 * renders in its own (UTC on most hosts) and the browser in the user's, and if
 * the two format the same value differently React throws a hydration error.
 * Pinning both makes them agree, and Africa/Lagos is where the sites are,
 * whichever laptop is looking at them.
 *
 * Currency and time zone become company settings once there's a backend to
 * hold them; until then they're constants.
 */
export const LOCALE = "en-NG";
export const CURRENCY = "NGN";
export const TIME_ZONE = "Africa/Lagos";

const MS_PER_DAY = 86_400_000;

// ---------------------------------------------------------------------------
// Numbers and money
// ---------------------------------------------------------------------------

const numberFormats = new Map<string, Intl.NumberFormat>();

/** Intl formatters are slow to build and safe to share, so build each once. */
function numberFormat(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(LOCALE, options);
    numberFormats.set(key, format);
  }
  return format;
}

/** 1,234,567 · `formatNumber(2.5, { decimals: 1 })` → 2.5 */
export function formatNumber(value: number, { decimals = 0 }: { decimals?: number } = {}): string {
  return numberFormat({ maximumFractionDigits: decimals }).format(value);
}

/**
 * ₦412,600,000. Whole naira by default, since the design never shows kobo
 * outside an invoice; `{ kobo: true }` gives ₦1,234.50 for invoice lines.
 *
 * Amounts are naira as plain numbers for now. How money travels between the
 * backend and this app (integer kobo, or decimal strings) is a backend
 * decision still to make, and this signature will follow it.
 */
export function formatMoney(amount: number, { kobo = false }: { kobo?: boolean } = {}): string {
  return numberFormat({
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: kobo ? 2 : 0,
    maximumFractionDigits: kobo ? 2 : 0,
  }).format(amount);
}

const COMPACT_STEPS = [
  { divisor: 1e9, suffix: "bn", decimals: 2, fixed: true },
  { divisor: 1e6, suffix: "m", decimals: 1, fixed: false },
  { divisor: 1e3, suffix: "k", decimals: 1, fixed: false },
] as const;

/**
 * ₦8.66bn · ₦412.6m · ₦960m · ₦45k, for headline figures in tiles and dense
 * tables. Billions keep two decimals (₦4.20bn) and the rest drop trailing
 * zeros, the way the design writes them. Intl's own compact notation gives
 * "₦8.7B", which is why this exists.
 *
 * A value that rounds up into the next step is promoted (999.95m → ₦1.00bn,
 * not ₦1,000m). Put the exact figure from `formatMoney` in a title or tooltip
 * wherever this is shown.
 */
export function formatMoneyCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  for (let i = 0; i < COMPACT_STEPS.length; i++) {
    const step = COMPACT_STEPS[i]!;
    if (abs < step.divisor) continue;

    const scaled = Number((abs / step.divisor).toFixed(step.decimals));
    const larger = COMPACT_STEPS[i - 1];
    if (scaled >= 1000 && larger) {
      const promoted = (abs / larger.divisor).toFixed(larger.decimals);
      return `${sign}₦${promoted}${larger.suffix}`;
    }

    const digits = numberFormat({
      minimumFractionDigits: step.fixed ? step.decimals : 0,
      maximumFractionDigits: step.decimals,
    }).format(scaled);
    return `${sign}₦${digits}${step.suffix}`;
  }

  return formatMoney(amount);
}

/** A ratio as a percentage: `formatPercent(0.62)` → 62%. */
export function formatPercent(ratio: number, { decimals = 0 }: { decimals?: number } = {}): string {
  return numberFormat({ style: "percent", maximumFractionDigits: decimals }).format(ratio);
}

/** 1 invoice · 3 invoices · `formatCount(2, "person", "people")` → 2 people */
export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  return input instanceof Date ? input : new Date(input);
}

const DATE_STYLES = {
  /** Jun 2027 */
  month: { month: "short", year: "numeric" },
  /** 26 Oct */
  short: { day: "numeric", month: "short" },
  /** 26 Oct 2026 */
  medium: { day: "numeric", month: "short", year: "numeric" },
  /** 26 October 2026 */
  long: { day: "numeric", month: "long", year: "numeric" },
  /** Monday, 26 October 2026 */
  full: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DateStyle = keyof typeof DATE_STYLES;

const dateFormats = new Map<string, Intl.DateTimeFormat>();

function dateFormat(options: Intl.DateTimeFormatOptions, locale = LOCALE): Intl.DateTimeFormat {
  const key = locale + JSON.stringify(options);
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { ...options, timeZone: TIME_ZONE });
    dateFormats.set(key, format);
  }
  return format;
}

/** 26 Oct 2026 by default; see `DateStyle` for the others. */
export function formatDate(input: DateInput, style: DateStyle = "medium"): string {
  return dateFormat(DATE_STYLES[style]).format(toDate(input));
}

/**
 * 4:52 PM. Assembled from parts rather than taken whole: some ICU builds put
 * a narrow no-break space before "PM" and others a plain one, so server and
 * browser can disagree by one invisible character, which is a hydration error.
 */
export function formatTime(input: DateInput): string {
  const parts = dateFormat({ hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(
    toDate(input),
  );
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("hour")}:${part("minute")} ${part("dayPeriod").toUpperCase()}`;
}

/** Days since the epoch, counted on the calendar in Lagos rather than in UTC. */
function calendarDay(input: DateInput): number {
  const parts = dateFormat(
    { year: "numeric", month: "numeric", day: "numeric" },
    "en-CA",
  ).formatToParts(toDate(input));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day")) / MS_PER_DAY;
}

/**
 * The Lagos calendar day as the API writes one, "2026-10-27": for file names,
 * date inputs and comparing with ISODate fields.
 */
export function toISODate(input: DateInput): string {
  return new Date(calendarDay(input) * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * Whole calendar days from `from` to `to`, in Lagos. 1 means "tomorrow"
 * whatever the hour: 11pm to 1am the next day is 1, not 0.
 */
export function daysBetween(from: DateInput, to: DateInput): number {
  return calendarDay(to) - calendarDay(from);
}

const relativeDays = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

/**
 * today · tomorrow · in 2 days · yesterday · 12 days ago
 *
 * Takes `now` so the result is testable, and because a Server Component can't
 * read the clock while it's being prerendered (Cache Components errors on
 * it). Pass `now` explicitly when calling this on the server.
 */
export function formatRelativeDay(input: DateInput, now: DateInput = new Date()): string {
  return relativeDays.format(daysBetween(now, input), "day");
}

/** Today, 4:52 PM · Yesterday, 4:52 PM · 23 Oct, 4:52 PM · 23 Oct 2025, 4:52 PM */
export function formatDateTime(input: DateInput, now: DateInput = new Date()): string {
  const time = formatTime(input);
  const days = daysBetween(now, input);
  if (days === 0) return `Today, ${time}`;
  if (days === -1) return `Yesterday, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;

  const year = (d: DateInput) => dateFormat({ year: "numeric" }).format(toDate(d));
  return `${formatDate(input, year(input) === year(now) ? "short" : "medium")}, ${time}`;
}

/**
 * The pieces of a date, for a calendar-style badge: { day: "28", month: "Oct",
 * weekday: "Wed" }.
 */
export function formatDateParts(input: DateInput): { day: string; month: string; weekday: string } {
  const parts = dateFormat({ day: "numeric", month: "short", weekday: "short" }).formatToParts(
    toDate(input),
  );
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return { day: part("day"), month: part("month"), weekday: part("weekday") };
}

/**
 * "Oct ’25": month and two-digit year, for tight spaces like a timeline's
 * axis. Assembled from parts, because Intl's two-digit year gives "Oct 25",
 * which reads as a day of the month.
 */
export function formatMonthYearShort(input: DateInput): string {
  const parts = dateFormat({ month: "short", year: "2-digit" }).formatToParts(toDate(input));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("month")} ’${part("year")}`;
}

/**
 * A calendar month as the API sends it ("2026-10"): "Oct", or "October 2026"
 * with `style: "long"`. Read at noon on the 1st, so no time zone can tip it
 * into the month before.
 */
export function formatMonth(month: string, style: "short" | "long" = "short"): string {
  const options: Intl.DateTimeFormatOptions =
    style === "short" ? { month: "short" } : { month: "long", year: "numeric" };
  return dateFormat(options).format(new Date(`${month}-01T12:00:00Z`));
}

/** Good morning · Good afternoon · Good evening, by the hour in Lagos. */
export function formatGreeting(now: DateInput): string {
  const hour = Number(dateFormat({ hour: "numeric", hourCycle: "h23" }).format(toDate(now)));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
