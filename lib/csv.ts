/**
 * CSV exports, built in the browser from data the page already has.
 *
 * Exports carry raw values, not display text: amounts as plain naira numbers
 * and dates as 2026-10-27, so a spreadsheet can sum and sort them. The
 * screens round to ₦1.07bn; the file keeps every naira.
 */

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  // Spreadsheets run a cell that starts with = + - or @ as a formula, which
  // lets a project named "=HYPERLINK(…)" do things. A leading apostrophe
  // makes it plain text.
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [
    columns.map((column) => cell(column.header)),
    ...rows.map((row) => columns.map((column) => cell(column.value(row)))),
  ];
  return lines.map((line) => line.join(",")).join("\r\n");
}

/**
 * Builds the CSV and hands it to the browser as a download. It starts with a
 * byte-order mark, without which Excel reads the file as ANSI and ₦ arrives
 * as "â‚¦".
 */
export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const blob = new Blob(["﻿", toCsv(rows, columns)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the download a moment to start before the URL is let go.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
