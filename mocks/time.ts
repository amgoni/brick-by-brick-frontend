/**
 * Dates for the mock data, relative to "now" on the Lagos calendar, so the
 * seed always reads as current: reports from yesterday, a service due in two
 * days, an invoice twelve days overdue.
 *
 * Lagos is UTC+1 all year with no daylight saving, which is the only reason
 * plain arithmetic is safe here. The real backend will store UTC instants and
 * leave calendar maths to the database.
 */

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 86_400_000;

/** "YYYY-MM-DD": the Lagos day `offset` days from `now`. */
export function lagosDay(now: Date, offset = 0): string {
  return new Date(now.getTime() + LAGOS_OFFSET_MS + offset * DAY_MS).toISOString().slice(0, 10);
}

/** The instant at `time` ("16:52") on the Lagos day `offset` days from `now`. */
export function lagosAt(now: Date, offset: number, time: string): string {
  return new Date(`${lagosDay(now, offset)}T${time}:00+01:00`).toISOString();
}

/** "YYYY-MM-DD": `offset` days after the day `day`. */
export function shiftDay(day: string, offset: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + offset * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from one "YYYY-MM-DD" to another. */
export function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** "YYYY-MM": the month `offset` months from the current Lagos month. */
export function lagosMonth(now: Date, offset = 0): string {
  const today = lagosDay(now);
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7);
}
