"use client";

import { useLayoutEffect, useRef } from "react";
import type { ISODate } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatMonth, formatMonthYearShort } from "@/lib/format";

export interface GanttRow {
  key: string;
  label: string;
  /** A second line under the label: its dates and how far along it is. */
  meta?: string;
  start: ISODate;
  finish: ISODate;
  /** Share complete, 0–1: how much of the bar is filled. */
  progress: number;
}

export interface GanttMarker {
  key: string;
  /** Shown on hover; list the markers in full somewhere beside the chart too. */
  label: string;
  date: ISODate;
  /** Filled once passed, outlined while still to come. */
  done: boolean;
}

interface GanttChartProps {
  rows: GanttRow[];
  /** Heading of the label column: "Phase". */
  rowsLabel: string;
  markers?: GanttMarker[];
  markersLabel?: string;
  /** The chart spans whole months, from the month of `from` to the month of `to`. */
  from: ISODate;
  to: ISODate;
  /** Drawn as a line; a chart wider than its box opens scrolled to it. */
  today?: ISODate;
  "aria-label": string;
  className?: string;
}

const DAY_MS = 86_400_000;
const dayNumber = (date: string) => Date.parse(`${date.slice(0, 10)}T00:00:00Z`) / DAY_MS;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** "2026-01", "2026-02", … from the month of `from` to the month after `to`'s. */
function monthStarts(from: ISODate, to: ISODate): string[] {
  let year = Number(from.slice(0, 4));
  let month = Number(from.slice(5, 7));
  const end = to.slice(0, 7);
  const months: string[] = [];
  for (;;) {
    const current = `${year}-${String(month).padStart(2, "0")}`;
    months.push(current);
    if (current > end) return months;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
}

/**
 * A programme: one bar per row from its planned start to its planned finish,
 * outlined for what's planned and filled for the share that's done, over a
 * month grid, with markers (milestones) on a row of their own and a line at
 * today.
 *
 * Drawn to the dataviz rules: one data colour, told apart by outline and
 * fill; solid hairline month lines; bars well under 24px; a 2px surface ring
 * round each marker. Each row's dates and percentage are printed in the label
 * column, so nothing is only reachable by hovering. The bars themselves are
 * hidden from screen readers, which read the labels instead.
 *
 * Months are drawn to scale, by day, so a 31-day month is wider than
 * February. On a narrow screen the chart scrolls sideways with the label
 * column pinned.
 */
export function GanttChart({
  rows,
  rowsLabel,
  markers = [],
  markersLabel = "Milestones",
  from,
  to,
  today,
  "aria-label": ariaLabel,
  className,
}: GanttChartProps) {
  const months = monthStarts(from, to);
  const first = dayNumber(`${months[0]}-01`);
  const span = dayNumber(`${months.at(-1)}-01`) - first;
  const at = (date: string) => clamp01((dayNumber(date) - first) / span);
  const todayAt =
    today && dayNumber(today) >= first && dayNumber(today) <= first + span ? at(today) : null;
  // The last entry is the month after the range ends: the chart's right edge.
  const shown = months.slice(0, -1);

  // Every month is gridded, but a long programme names only every quarter
  // (or year), so the names never run into each other. The first name, and
  // each January's, carries the year.
  const every = shown.length > 60 ? 12 : shown.length > 24 ? 3 : 1;
  let named = 0;
  const axis = shown.flatMap((month) => {
    const number = Number(month.slice(5, 7));
    if ((number - 1) % every !== 0) return [];
    const withYear = named++ === 0 || number === 1;
    return [{ month, name: withYear ? formatMonthYearShort(`${month}-15`) : formatMonth(month) }];
  });

  const scroller = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = scroller.current;
    if (!element || todayAt === null || element.scrollWidth <= element.clientWidth) return;
    const label = element.querySelector<HTMLElement>("[data-gantt-label]")?.offsetWidth ?? 0;
    const track = element.querySelector<HTMLElement>("[data-gantt-track]")?.offsetWidth ?? 0;
    // Today in the middle of what's visible beside the pinned labels.
    element.scrollLeft = track * todayAt - (element.clientWidth - label) / 2;
  }, [todayAt]);

  const position = (fraction: number) => ({ left: `${fraction * 100}%` });

  // The track stops short of the right edge (mr-4, right-4), so a marker on
  // the last day isn't cut in half by the card.
  return (
    <div
      ref={scroller}
      role="group"
      aria-label={ariaLabel}
      className={cn("overflow-x-auto [--label:9.5rem] md:[--label:14.375rem]", className)}
    >
      <div className="relative min-w-240">
        {/* Month lines and today, behind the bars, through every row. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-4 left-(--label)"
        >
          {shown.map((month) => (
            <span
              key={month}
              className="absolute inset-y-0 border-l border-line"
              style={position(at(`${month}-01`))}
            />
          ))}
          {todayAt !== null && (
            <span
              className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-accent"
              style={position(todayAt)}
            />
          )}
        </div>

        <div className="grid grid-cols-[var(--label)_1fr] border-b border-line">
          <div
            data-gantt-label
            className="sticky left-0 z-10 border-r border-line bg-surface px-4.5 pt-2.5 text-xs font-medium text-ink-3"
          >
            {rowsLabel}
          </div>
          <div data-gantt-track aria-hidden="true" className="relative mr-4 h-14">
            {axis.map(({ month, name }) => (
              <span
                key={month}
                className="absolute top-2.5 pl-1.5 text-2xs whitespace-nowrap text-ink-3"
                style={position(at(`${month}-01`))}
              >
                {name}
              </span>
            ))}
            {todayAt !== null && (
              <span
                className="absolute bottom-1.5 pl-2 text-2xs font-semibold text-ink"
                style={position(todayAt)}
              >
                Today
              </span>
            )}
          </div>
        </div>

        <ul>
          {rows.map((row) => {
            const start = at(row.start);
            return (
              <li key={row.key} className="grid grid-cols-[var(--label)_1fr] border-b border-line">
                <div className="sticky left-0 z-10 flex flex-col justify-center border-r border-line bg-surface px-4.5 py-2.5">
                  <span className="text-md">{row.label}</span>
                  {row.meta && <span className="text-sm text-ink-3 tabular-nums">{row.meta}</span>}
                </div>
                <div aria-hidden="true" className="relative mr-4 min-h-13">
                  <span
                    className="absolute top-1/2 h-4.5 -translate-y-1/2 overflow-hidden rounded-sm border-[1.5px] border-data"
                    style={{
                      ...position(start),
                      width: `${Math.max(0, at(row.finish) - start) * 100}%`,
                    }}
                  >
                    <span
                      className="block h-full bg-data"
                      style={{ width: `${clamp01(row.progress) * 100}%` }}
                    />
                  </span>
                </div>
              </li>
            );
          })}
          {markers.length > 0 && (
            <li className="grid grid-cols-[var(--label)_1fr]">
              <div className="sticky left-0 z-10 flex items-center border-r border-line bg-surface px-4.5 py-2.5 text-md">
                {markersLabel}
              </div>
              <div aria-hidden="true" className="relative mr-4 min-h-12">
                {markers.map((marker) => (
                  <span
                    key={marker.key}
                    title={marker.label}
                    className={cn(
                      "absolute top-1/2 size-3 -translate-1/2 rotate-45 border-[1.5px] border-data ring-2 ring-surface",
                      marker.done ? "bg-data" : "bg-surface",
                    )}
                    style={position(at(marker.date))}
                  />
                ))}
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

/** The key: what outlined, filled, a diamond and the line each mean. */
export function GanttLegend({ markerLabel = "Milestone" }: { markerLabel?: string }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="h-2.5 w-4.5 rounded-[3px] border-[1.5px] border-data" />
        Planned
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="h-2.5 w-4.5 rounded-[3px] bg-data" />
        Complete
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="mx-0.5 size-2.5 rotate-45 border-[1.5px] border-data" />
        {markerLabel}
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="h-3.5 w-0.5 bg-accent" />
        Today
      </li>
    </ul>
  );
}
