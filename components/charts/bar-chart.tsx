"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChartEmpty, ChartTable, Legend, SERIES } from "./chart-kit";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  meta?: string;
  href?: string;
}

export function HBarChart({
  data,
  valueSuffix = "",
  className,
  tableColumns = ["Item", "Value"],
  max: maxOverride,
}: {
  data: BarDatum[];
  valueSuffix?: string;
  className?: string;
  tableColumns?: [string, string];
  max?: number;
}) {
  if (!data.length) return <ChartEmpty />;

  const max = maxOverride ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={className}>
      <ul className="space-y-3">
        {data.map((d, index) => (
          <li key={index} className="group">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="truncate text-xs font-medium" title={d.label}>
                {d.label}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums">
                {d.value}
                {valueSuffix}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ background: "var(--viz-track)" }}
              role="img"
              aria-label={`${d.label}: ${d.value}${valueSuffix}`}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%`,
                  background: d.color ?? "var(--viz-1)",
                }}
              />
            </div>
            {d.meta && (
              <p className="mt-1 text-[0.7rem] text-muted-foreground">
                {d.meta}
              </p>
            )}
          </li>
        ))}
      </ul>

      <ChartTable
        columns={tableColumns}
        rows={data.map((d) => [d.label, `${d.value}${valueSuffix}`])}
      />
    </div>
  );
}

export interface GroupedRow {
  label: string;
  values: number[];
}

export function GroupedBarChart({
  rows,
  seriesLabels,
  className,
}: {
  rows: GroupedRow[];
  seriesLabels: string[];
  className?: string;
}) {
  if (!rows.length) return <ChartEmpty />;

  const series = seriesLabels.map((label, i) => ({
    label,
    color: SERIES[i % SERIES.length],
  }));
  const max = Math.max(...rows.flatMap((r) => r.values), 1);

  return (
    <div className={className}>
      <Legend series={series} className="mb-4" />

      <ul className="space-y-3.5">
        {rows.map((row, index) => (
          <li key={index}>
            <p className="mb-1 truncate text-xs font-medium" title={row.label}>
              {row.label}
            </p>
            <div className="space-y-1">
              {row.values.map((value, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full"
                    style={{ background: "var(--viz-track)" }}
                    role="img"
                    aria-label={`${row.label} — ${series[i].label}: ${value}`}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${Math.max((value / max) * 100, value > 0 ? 2 : 0)}%`,
                        background: series[i].color,
                      }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right text-[0.7rem] font-medium tabular-nums text-muted-foreground">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <ChartTable
        columns={["Name", ...seriesLabels]}
        rows={rows.map((r) => [r.label, ...r.values])}
      />
    </div>
  );
}

export interface StackSegment {
  label: string;
  value: number;
  color?: string;
}

export function StackedBar({
  segments,
  className,
  showLegend = true,
}: {
  segments: StackSegment[];
  className?: string;
  showLegend?: boolean;
}) {
  const visible = segments.filter((s) => s.value > 0);
  const total = visible.reduce((sum, s) => sum + s.value, 0);

  if (!total) return <ChartEmpty />;

  const withColor = visible.map((s, i) => ({
    ...s,
    color: s.color ?? SERIES[i % SERIES.length],
  }));

  return (
    <div className={className}>
      <div
        className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
        style={{ background: "var(--viz-track)" }}
        role="img"
        aria-label={withColor
          .map((s) => `${s.label}: ${s.value}`)
          .join(", ")}
      >
        {withColor.map((s, index) => (
          <div
            key={index}
            className="h-full first:rounded-l-full last:rounded-r-full transition-[width] duration-500"
            style={{
              width: `${(s.value / total) * 100}%`,
              background: s.color,
            }}
          />
        ))}
      </div>

      {showLegend && (
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {withColor.map((s, index) => (
            <li key={index} className="flex items-center gap-1.5 text-xs">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: s.color }}
              />
              <span className="truncate text-muted-foreground">{s.label}</span>
              <span className="ml-auto font-semibold tabular-nums">
                {s.value}
              </span>
            </li>
          ))}
        </ul>
      )}

      <ChartTable
        columns={["Status", "Tasks", "Share"]}
        rows={withColor.map((s) => [
          s.label,
          s.value,
          `${Math.round((s.value / total) * 100)}%`,
        ])}
      />
    </div>
  );
}

export function Meter({
  value,
  max = 100,
  label,
  className,
  color = "var(--viz-1)",
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  color?: string;
}) {
  const pct = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-semibold tabular-nums">{pct}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--viz-track)" }}
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
