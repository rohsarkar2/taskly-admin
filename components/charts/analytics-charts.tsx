"use client";

/**
 * Dashboard charts, built on Recharts.
 *
 * Form is picked by the data's job, colour last: trend over time -> area, compare
 * magnitude -> horizontal bars, part-to-whole per project -> stacked bars, a single
 * ratio -> a gauge. Every chart ships a legend (2+ series), selective direct labels,
 * a hover tooltip and a table-view twin, because three light-mode slots sit under
 * 3:1 against the surface and must never be read from the fill alone.
 */

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartEmpty, ChartTable } from "./chart-kit";
import {
  AXIS_STROKE,
  AXIS_TICK,
  BAND_CURSOR,
  ChartFrame,
  GRID_STROKE,
  LINE_CURSOR,
  SURFACE_GAP,
  SeriesLegend,
  chartTooltip,
  formatCount,
  niceTicks,
} from "./recharts-kit";

/* -------------------------------------------------------------------------- */
/* Trend — tasks created vs completed                                          */
/* -------------------------------------------------------------------------- */

export interface TrendDatum {
  label: string;
  created: number;
  completed: number;
}

const TREND_SERIES = [
  { key: "created", label: "Created", color: "var(--viz-1)" },
  { key: "completed", label: "Completed", color: "var(--viz-2)" },
] as const;

const trendTooltip = chartTooltip();

export function TrendAreaChart({
  data,
  height = 280,
}: {
  data: TrendDatum[];
  height?: number;
}) {
  if (!data.length) return <ChartEmpty message="No trend data yet" />;

  const ticks = niceTicks(
    Math.max(...data.flatMap((d) => [d.created, d.completed]), 1),
  );
  const last = data[data.length - 1];

  return (
    <div>
      <SeriesLegend
        className="mb-3"
        items={[
          { label: "Created", color: "var(--viz-1)", value: last.created },
          { label: "Completed", color: "var(--viz-2)", value: last.completed },
        ]}
      />
      <p className="mb-2 text-[0.7rem] text-muted-foreground">
        Values shown are for {last.label}, the latest day in range.
      </p>

      <ChartFrame
        height={height}
        label={`Tasks created and completed per day across ${data.length} days`}
      >
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          accessibilityLayer
        >
          <defs>
            {TREND_SERIES.map((s) => (
              <linearGradient
                key={s.key}
                id={`trend-fill-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.16} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: AXIS_STROKE }}
            tick={AXIS_TICK}
            minTickGap={28}
            tickMargin={8}
          />
          <YAxis
            width={40}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            allowDecimals={false}
          />
          <Tooltip content={trendTooltip} cursor={LINE_CURSOR} />

          {TREND_SERIES.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={`url(#trend-fill-${s.key})`}
              dot={false}
              activeDot={{
                r: 4,
                strokeWidth: 2,
                stroke: "var(--viz-surface)",
              }}
            />
          ))}
        </AreaChart>
      </ChartFrame>

      <ChartTable
        columns={["Day", "Created", "Completed"]}
        rows={data.map((d) => [d.label, d.created, d.completed])}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Horizontal bars — compare magnitude across categories                       */
/* -------------------------------------------------------------------------- */

export interface CategoryDatum {
  label: string;
  value: number;
  color?: string;
  /** Extra line shown in the tooltip, e.g. a share of the total. */
  note?: string;
}

const categoryTooltip = chartTooltip({
  rows: (entries) => {
    const row = entries[0]?.payload as CategoryDatum | undefined;
    if (!row) return [];
    return [
      { label: "Count", value: formatCount(row.value), color: row.color },
      ...(row.note ? [{ label: "Share", value: row.note }] : []),
    ];
  },
});

export function CategoryBarChart({
  data,
  labelWidth = 116,
  barSize = 18,
  ariaLabel,
  tableColumns = ["Category", "Count"],
}: {
  data: CategoryDatum[];
  labelWidth?: number;
  barSize?: number;
  ariaLabel: string;
  tableColumns?: [string, string];
}) {
  if (!data.length || data.every((d) => d.value === 0))
    return <ChartEmpty />;

  const ticks = niceTicks(Math.max(...data.map((d) => d.value), 1));
  const height = data.length * (barSize + 22) + 32;

  return (
    <div>
      <ChartFrame height={height} label={ariaLabel}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 4, left: 0 }}
          barCategoryGap="28%"
          accessibilityLayer
        >
          <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={labelWidth}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
          />
          <Tooltip content={categoryTooltip} cursor={BAND_CURSOR} />
          <Bar dataKey="value" barSize={barSize} radius={[0, 4, 4, 0]}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.color ?? "var(--viz-1)"} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              offset={8}
              fill="var(--viz-muted-ink)"
              fontSize={12}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ChartFrame>

      <ChartTable
        columns={tableColumns}
        rows={data.map((d) => [d.label, d.value])}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stacked bars — part-to-whole of every project's task load                   */
/* -------------------------------------------------------------------------- */

export interface ProjectBarDatum {
  name: string;
  completed: number;
  onTrack: number;
  overdue: number;
  total: number;
  percentage: number;
}

const PROJECT_SERIES = [
  { key: "completed", label: "Completed", color: "var(--viz-good)" },
  { key: "onTrack", label: "Remaining", color: "var(--viz-1)" },
  { key: "overdue", label: "Overdue", color: "var(--viz-critical)" },
] as const;

const projectTooltip = chartTooltip({
  title: (label) => String(label ?? ""),
  rows: (entries) => {
    const row = entries[0]?.payload as ProjectBarDatum | undefined;
    if (!row) return [];
    return [
      ...PROJECT_SERIES.map((s) => ({
        label: s.label,
        value: formatCount(row[s.key]),
        color: s.color,
      })),
      { label: "Progress", value: `${Math.round(row.percentage)}%` },
    ];
  },
});

export function ProjectStackedBars({
  data,
  labelWidth = 150,
}: {
  data: ProjectBarDatum[];
  labelWidth?: number;
}) {
  if (!data.length) return <ChartEmpty message="No active projects" />;

  const barSize = 18;
  const height = data.length * (barSize + 20) + 36;
  const ticks = niceTicks(Math.max(...data.map((d) => d.total), 1));

  return (
    <div>
      <SeriesLegend
        className="mb-3"
        items={PROJECT_SERIES.map((s) => ({ label: s.label, color: s.color }))}
      />

      <ChartFrame
        height={height}
        label={`Task breakdown for ${data.length} active projects`}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
          barCategoryGap="26%"
          accessibilityLayer
        >
          <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={labelWidth}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
          />
          <Tooltip content={projectTooltip} cursor={BAND_CURSOR} />

          {PROJECT_SERIES.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="tasks"
              fill={s.color}
              barSize={barSize}
              radius={
                index === PROJECT_SERIES.length - 1
                  ? [0, 4, 4, 0]
                  : [0, 0, 0, 0]
              }
              {...SURFACE_GAP}
            />
          ))}
        </BarChart>
      </ChartFrame>

      <ChartTable
        columns={["Project", "Completed", "Remaining", "Overdue", "Progress"]}
        rows={data.map((d) => [
          d.name,
          d.completed,
          d.onTrack,
          d.overdue,
          `${Math.round(d.percentage)}%`,
        ])}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Gauge — one ratio against its limit                                         */
/* -------------------------------------------------------------------------- */

/** Fill carries severity; the track is a light step of the same hue. */
function gaugeColor(percentage: number): string {
  if (percentage >= 75) return "var(--viz-good)";
  if (percentage >= 40) return "var(--viz-warning)";
  return "var(--viz-serious)";
}

export function CompletionGauge({
  percentage,
  caption,
  height = 190,
}: {
  percentage: number;
  caption?: string;
  height?: number;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percentage)));
  const color = gaugeColor(value);

  return (
    <div className="relative" style={{ height }}>
      <ChartFrame height={height} label={`Task completion rate: ${value}%`}>
        <RadialBarChart
          data={[{ name: "Completion", value }]}
          startAngle={220}
          endAngle={-40}
          innerRadius="74%"
          outerRadius="100%"
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
            axisLine={false}
          />
          <RadialBar
            dataKey="value"
            angleAxisId={0}
            cornerRadius={999}
            fill={color}
            background={{
              fill: `color-mix(in oklch, ${color} 14%, var(--viz-track))`,
            }}
          />
        </RadialBarChart>
      </ChartFrame>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl leading-none font-semibold">{value}%</span>
        {caption && (
          <span className="mt-2 text-xs text-muted-foreground">{caption}</span>
        )}
      </div>
    </div>
  );
}
