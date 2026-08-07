"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared chart chrome.
 *
 * Every chart in this app pairs its marks with a legend (2+ series), direct
 * value labels and a collapsible table view — three light-mode categorical
 * slots sit under 3:1 against the white card surface, so identity is never
 * carried by fill colour alone.
 */

/** Categorical slots, assigned in fixed order and never cycled. */
export const SERIES = [
  "var(--viz-1)",
  "var(--viz-2)",
  "var(--viz-3)",
  "var(--viz-4)",
  "var(--viz-5)",
  "var(--viz-6)",
] as const;

export const STATUS_COLOR = {
  good: "var(--viz-good)",
  warning: "var(--viz-warning)",
  serious: "var(--viz-serious)",
  critical: "var(--viz-critical)",
} as const;

export interface Series {
  label: string;
  color: string;
}

export function Legend({
  series,
  className,
}: {
  series: Series[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}>
      {series.map((s) => (
        <li
          key={s.label}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ background: s.color }}
          />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * The accessible fallback every chart carries: the same numbers as a table,
 * behind a disclosure so it does not compete with the marks.
 */
export function ChartTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <details className="mt-4 border-t pt-3">
      <summary className="cursor-pointer text-xs text-muted-foreground select-none hover:text-foreground">
        View as table
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="border-b">
              {columns.map((c, i) => (
                <th
                  key={c}
                  className={cn(
                    "py-1.5 pr-3 font-medium text-muted-foreground",
                    i === 0 ? "text-left" : "text-right",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[0])} className="border-b last:border-0">
                {row.map((cell, i) => (
                  <td
                    key={i}
                    className={cn(
                      "py-1.5 pr-3",
                      i === 0 ? "text-left" : "text-right",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Floating tooltip body, positioned by the caller. */
export function TooltipCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string | number; color?: string }[];
}) {
  return (
    <div className="pointer-events-none rounded-lg border bg-popover px-2.5 py-2 text-popover-foreground shadow-md">
      <p className="mb-1 text-xs font-medium">{title}</p>
      <ul className="space-y-0.5">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center gap-2 text-xs whitespace-nowrap"
          >
            {r.color && (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-[2px]"
                style={{ background: r.color }}
              />
            )}
            <span className="text-muted-foreground">{r.label}</span>
            <span className="ml-auto font-medium tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartEmpty({ message = "No data yet" }: { message?: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
