import type { ISODate, ISODateTime } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDateParts } from "@/lib/format";

/**
 * A date as a calendar page: the day large, the month small beneath it. For
 * lists ordered by date (milestones, site reports), where scanning the left
 * edge should read like a calendar. Takes a day or an instant; an instant
 * shows the day it fell on in Lagos.
 */
export function DateBox({ date, className }: { date: ISODate | ISODateTime; className?: string }) {
  const { day, month } = formatDateParts(date);
  return (
    <time
      data-slot="date-box"
      dateTime={date}
      className={cn(
        "flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-line-strong leading-tight",
        className,
      )}
    >
      <span className="text-lg font-semibold">{day}</span>
      <span className="text-2xs tracking-[0.06em] text-ink-3 uppercase">{month}</span>
    </time>
  );
}
