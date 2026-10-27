"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";
import { niceTicks } from "./ticks";

export interface ColumnSeries {
  key: string;
  label: string;
  /**
   * How its bars are drawn. The palette has one data colour, so two series
   * are told apart by fill (solid against outlined), which also survives
   * colour blindness and greyscale print.
   */
  appearance: "solid" | "outline";
}

export interface ColumnDatum {
  key: string;
  /** Under the column: "Oct". */
  label: string;
  /** For screen readers and readouts: "October 2026". */
  description: string;
  values: Record<string, number>;
}

interface ColumnChartProps {
  data: ColumnDatum[];
  /** At most two: solid and outline. */
  series: ColumnSeries[];
  /** The highlighted column. Hover, tap or arrow keys move it. */
  selected: string;
  onSelectedChange: (key: string) => void;
  /** A value in a column's accessible name: "₦742m". */
  formatValue: (value: number) => string;
  /** Axis labels: "800". */
  formatTick?: (value: number) => string;
  "aria-label": string;
  className?: string;
}

const PLOT_HEIGHT = 180;
const TOP_PADDING = 8; // room for the top tick's label
const AXIS_BAND = 28; // the column labels underneath

/**
 * Grouped columns over time, drawn to the dataviz spec: bars no wider than
 * 12px with a 2px gap, 4px rounded tops and a square base, solid hairline
 * gridlines, and round axis ticks.
 *
 * Each column (bars and label together) is one hit target, far bigger than
 * the bars themselves. It's a single-select Radix toggle group underneath,
 * which Radix exposes as a radio group: one tab stop, arrow keys between the
 * columns, and the selected one announced as checked. Its values belong in a
 * readout next to the chart, and every value in a table view, so nothing is
 * only reachable by hovering.
 */
export function ColumnChart({
  data,
  series,
  selected,
  onSelectedChange,
  formatValue,
  formatTick = String,
  "aria-label": ariaLabel,
  className,
}: ColumnChartProps) {
  const max = Math.max(0, ...data.flatMap((datum) => Object.values(datum.values)));
  const ticks = niceTicks(max);
  const top = ticks.at(-1) ?? 1;

  return (
    <div
      data-slot="column-chart"
      className={cn("relative", className)}
      style={{ height: TOP_PADDING + PLOT_HEIGHT + AXIS_BAND }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0"
        style={{ top: TOP_PADDING, height: PLOT_HEIGHT }}
      >
        {ticks.map((tick) => (
          <div
            key={tick}
            className={cn(
              "absolute right-0 left-11 border-t",
              tick === 0 ? "border-line-strong" : "border-line",
            )}
            style={{ bottom: `${(tick / top) * 100}%` }}
          >
            <span className="absolute -left-11 w-9 -translate-y-1/2 text-right text-2xs text-ink-3 tabular-nums">
              {formatTick(tick)}
            </span>
          </div>
        ))}
      </div>

      <ToggleGroupPrimitive.Root
        type="single"
        value={selected}
        onValueChange={(value) => value && onSelectedChange(value)}
        aria-label={ariaLabel}
        className="absolute inset-x-0 bottom-0 left-11 flex"
        style={{ top: TOP_PADDING }}
      >
        {data.map((datum) => (
          <ToggleGroupPrimitive.Item
            key={datum.key}
            value={datum.key}
            aria-label={`${datum.description}: ${series
              .map((s) => `${s.label.toLowerCase()} ${formatValue(datum.values[s.key] ?? 0)}`)
              .join(", ")}`}
            // Mouse hover previews a column; touch selects it with a tap instead.
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") onSelectedChange(datum.key);
            }}
            className="group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-md text-ink-3 data-[state=on]:text-ink"
          >
            <span
              className="flex w-full items-end justify-center gap-0.5 rounded-t-md px-1 transition-colors group-data-[state=on]:bg-hover"
              style={{ height: PLOT_HEIGHT }}
            >
              {series.map((s) => (
                <span
                  key={s.key}
                  className={cn(
                    "w-full max-w-3 rounded-t-sm",
                    s.appearance === "solid" ? "bg-data" : "border-[1.5px] border-b-0 border-data",
                  )}
                  style={{ height: `${((datum.values[s.key] ?? 0) / top) * 100}%` }}
                />
              ))}
            </span>
            <span className="text-2xs font-medium">{datum.label}</span>
          </ToggleGroupPrimitive.Item>
        ))}
      </ToggleGroupPrimitive.Root>
    </div>
  );
}

/** The key under a chart: a swatch drawn the way the series' bars are. */
export function ColumnLegend({ series }: { series: ColumnSeries[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn(
              "size-2.5 rounded-[3px]",
              s.appearance === "solid" ? "bg-data" : "border-[1.5px] border-data",
            )}
          />
          {s.label}
        </li>
      ))}
    </ul>
  );
}
