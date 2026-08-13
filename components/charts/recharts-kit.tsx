"use client";

/**
 * Shared Recharts primitives.
 *
 * Every chart on top of this file inherits the same chrome: hairline solid grid,
 * recessive axes in muted ink, 2px marks, a surface-coloured gap between touching
 * fills, and the app's `--viz-*` tokens (validated for light and dark) as the only
 * source of colour. Nothing here picks a colour on its own.
 */

import * as React from "react";
import { ResponsiveContainer } from "recharts";
import type { TooltipContentProps } from "recharts";
import { TooltipCard } from "./chart-kit";

/** Axis tick text — muted ink, never the series colour. */
export const AXIS_TICK = {
  fill: "var(--viz-muted-ink)",
  fontSize: 12,
} as const;

export const GRID_STROKE = "var(--viz-grid)";
export const AXIS_STROKE = "var(--viz-axis)";
export const SURFACE = "var(--viz-surface)";

/** Crosshair for time-series charts: solid hairline, never dashed. */
export const LINE_CURSOR = { stroke: AXIS_STROKE, strokeWidth: 1 } as const;

/** Hover band for categorical charts — generous hit target, recessive fill. */
export const BAND_CURSOR = { fill: "var(--viz-track)", fillOpacity: 0.6 } as const;

/** The 2px surface gap that separates touching marks (stacks, adjacent bars). */
export const SURFACE_GAP = { stroke: SURFACE, strokeWidth: 2 } as const;

/**
 * Round an axis maximum up to a clean value and return evenly spaced ticks, so
 * the y-axis carries the values that aren't directly labelled.
 */
export function niceTicks(max: number, count = 4): number[] {
  const raw = Math.max(max, 1) / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalized = raw / magnitude;
  const step =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) *
    magnitude;
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step));
}

export function formatCount(value: number): string {
  return value.toLocaleString();
}

/**
 * Sizes the plot so the axis band is inside the box — a fixed height that only
 * fits the plot leaves the tick labels to a nested scrollbar.
 */
export function ChartFrame({
  height,
  label,
  children,
}: {
  height: number;
  label: string;
  children: React.ReactElement;
}) {
  return (
    <div className="w-full" style={{ height }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export interface TooltipRow {
  label: string;
  value: string | number;
  color?: string;
}

/**
 * Builds a Recharts `content` renderer that draws the app's popover-styled
 * tooltip card. Tooltips enhance here — never gate: every value is also in the
 * axis, a direct label, or the table view.
 */
export function chartTooltip(
  options: {
    title?: (label: string | number | undefined, entries: TooltipEntry[]) => string;
    rows?: (entries: TooltipEntry[]) => TooltipRow[];
  } = {},
) {
  return function ChartTooltipContent(props: TooltipContentProps) {
    const entries = (props.payload ?? []) as unknown as TooltipEntry[];
    if (!props.active || entries.length === 0) return null;

    const title = options.title
      ? options.title(props.label, entries)
      : String(props.label ?? "");

    const rows =
      options.rows?.(entries) ??
      entries.map((entry) => ({
        label: String(entry.name ?? entry.dataKey ?? ""),
        value:
          typeof entry.value === "number"
            ? formatCount(entry.value)
            : String(entry.value ?? ""),
        color: entry.color,
      }));

    return <TooltipCard title={title} rows={rows} />;
  };
}

export interface LegendItem {
  label: string;
  color: string;
  /** Optional endpoint value — the direct label, moved out of the plot. */
  value?: string | number;
}

/**
 * Legend with an optional trailing value per series. Two or more series always
 * get a legend; the value slot carries the endpoint reading so converging lines
 * don't need colliding in-plot labels.
 */
export function SeriesLegend({
  items,
  className,
}: {
  items: LegendItem[];
  className?: string;
}) {
  return (
    <ul
      className={
        "flex flex-wrap items-center gap-x-5 gap-y-1.5" +
        (className ? ` ${className}` : "")
      }
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-xs">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ background: item.color }}
          />
          <span className="text-muted-foreground">{item.label}</span>
          {item.value !== undefined && (
            <span className="font-semibold tabular-nums">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
