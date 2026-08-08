"use client";

import * as React from "react";
import { ChartEmpty, ChartTable, Legend, SERIES, TooltipCard } from "./chart-kit";

export interface LineSeries {
  label: string;
  values: number[];
}

const VB_W = 720;
const VB_H = 260;
const PAD = { top: 16, right: 20, bottom: 30, left: 44 };

/**
 * Multi-series line chart for trend-over-time, with the crosshair + tooltip
 * hover layer every interactive chart ships by default.
 *
 * Strokes use `non-scaling-stroke` so the 2px mark weight holds at any
 * container width, and the last point of each series is direct-labelled so
 * identity never depends on the legend swatch alone.
 */
export function LineChart({
  categories,
  series,
  valueLabel = "Tasks",
  className,
}: {
  categories: string[];
  series: LineSeries[];
  valueLabel?: string;
  className?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  if (!categories.length || !series.length) return <ChartEmpty />;

  const legend = series.map((s, i) => ({
    label: s.label,
    color: SERIES[i % SERIES.length],
  }));

  const rawMax = Math.max(...series.flatMap((s) => s.values), 1);
  // Round the axis up to a clean step so ticks are readable numbers.
  const step = Math.max(1, Math.ceil(rawMax / 4 / 5) * 5);
  const max = step * 4;

  const plotW = VB_W - PAD.left - PAD.right;
  const plotH = VB_H - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left +
    (categories.length === 1 ? plotW / 2 : (i / (categories.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const ticks = [0, 1, 2, 3, 4].map((t) => t * step);

  /**
   * Draw roughly eight tick labels however many points there are.
   *
   * Thinning happens here rather than at the call site: blanking the incoming
   * categories would also blank the tooltip and the table view, and would give
   * several entries the same empty key.
   */
  const labelEvery = Math.max(1, Math.ceil(categories.length / 8));

  const handleMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const vbX = ratio * VB_W;
    const idx = Math.round(
      ((vbX - PAD.left) / plotW) * (categories.length - 1),
    );
    setHover(Math.min(Math.max(idx, 0), categories.length - 1));
  };

  const tooltipLeftPct = hover === null ? 0 : (x(hover) / VB_W) * 100;

  return (
    <div className={className}>
      <Legend series={legend} className="mb-3" />

      <div ref={wrapRef} className="relative">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full touch-none"
          role="img"
          aria-label={`${valueLabel} by period for ${series.map((s) => s.label).join(" and ")}`}
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
        >
          {/* Gridlines — recessive hairlines, no vertical grid */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={VB_W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--viz-grid)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={PAD.left - 8}
                y={y(t) + 4}
                textAnchor="end"
                fontSize={13}
                fill="var(--viz-muted-ink)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {t}
              </text>
            </g>
          ))}

          {/* Category labels — thinned so they never overlap */}
          {categories.map((c, i) =>
            i % labelEvery === 0 || i === categories.length - 1 ? (
              <text
                key={i}
                x={x(i)}
                y={VB_H - 8}
                textAnchor="middle"
                fontSize={13}
                fill="var(--viz-muted-ink)"
              >
                {c}
              </text>
            ) : null,
          )}

          {/* Crosshair */}
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--viz-axis)"
              strokeWidth={1}
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Series */}
          {series.map((s, si) => {
            const color = legend[si].color;
            const path = s.values
              .map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`)
              .join(" ");
            const lastIdx = s.values.length - 1;

            return (
              <g key={si}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                {/* 2px surface ring keeps overlapping markers separable */}
                {hover !== null && (
                  <circle
                    cx={x(hover)}
                    cy={y(s.values[hover])}
                    r={5}
                    fill={color}
                    stroke="var(--viz-surface)"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {/* Direct label on the final point */}
                <text
                  x={x(lastIdx) + 6}
                  y={y(s.values[lastIdx]) - 6}
                  fontSize={13}
                  fontWeight={600}
                  textAnchor="end"
                  fill="var(--viz-muted-ink)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {s.label}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1={PAD.left}
            x2={VB_W - PAD.right}
            y1={PAD.top + plotH}
            y2={PAD.top + plotH}
            stroke="var(--viz-axis)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {hover !== null && (
          <div
            className="absolute top-0 z-10"
            style={{
              left: `${tooltipLeftPct}%`,
              transform:
                tooltipLeftPct > 60
                  ? "translate(-105%, 0)"
                  : "translate(12px, 0)",
            }}
          >
            <TooltipCard
              title={categories[hover]}
              rows={series.map((s, i) => ({
                label: s.label,
                value: s.values[hover],
                color: legend[i].color,
              }))}
            />
          </div>
        )}
      </div>

      <ChartTable
        columns={["Period", ...series.map((s) => s.label)]}
        rows={categories.map((c, i) => [c, ...series.map((s) => s.values[i])])}
      />
    </div>
  );
}
