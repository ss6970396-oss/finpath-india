"use client";

import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactINR, formatINR } from "@/lib/format";
import { rupeesToPaise } from "@/lib/money";
import type { Series } from "@/lib/finance";

/**
 * The projection plot (§18).
 *
 * THREE LINES, AND ONLY THE FIRST IS SOLID. The step-up scenario is the
 * argument the page is making, so it is the accent line at 2px; the flat
 * scenario is a thin ink line; the delayed start is dashed and muted. Line
 * WEIGHT and DASH carry the ranking, not hue — the same reading survives
 * greyscale, a projector, and a colour-blind reader (§23).
 *
 * No dots on the line: a hundred and twenty markers on a thirty-year curve
 * is noise, and the tooltip already gives the exact value at a point.
 * Gridlines are horizontal only and drawn in the hairline colour, because
 * vertical gridlines on a time axis restate the tick labels.
 *
 * The axis uses compact lakh/crore notation, which is the ONE place a
 * rounded figure is permitted: an axis is a scale, not a statement. Every
 * figure quoted in the surrounding prose is exact.
 */

type Point = {
  year: number;
  stepUp: number;
  flat: number;
  delayed: number;
};

export function ScenarioChart({
  stepUp,
  flat,
  delayed,
  delayYears,
}: {
  stepUp: Series;
  flat: Series;
  delayed: Series;
  delayYears: number;
}) {
  const data: Point[] = stepUp.map((point, i) => ({
    year: point.year,
    stepUp: point.value,
    flat: flat[i]?.value ?? 0,
    delayed: delayed[i]?.value ?? 0,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={{ stroke: "var(--color-line-strong)" }}
            tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
            tickFormatter={(y: number) => (y === 0 ? "now" : `${y}y`)}
          />
          <YAxis
            width={64}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
            tickFormatter={(v: number) => formatCompactINR(rupeesToPaise(v))}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-line-strong)", strokeWidth: 1 }}
            content={<ScenarioTooltip delayYears={delayYears} />}
          />
          <Line
            type="monotone"
            dataKey="stepUp"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="flat"
            stroke="var(--color-ink)"
            strokeWidth={1}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="delayed"
            stroke="var(--color-ink-muted)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * The tooltip. Exact figures, never the compact axis form — the axis is a
 * scale and may round; a value someone deliberately pointed at may not.
 */
function ScenarioTooltip({
  active,
  payload,
  label,
  delayYears,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number }[];
  label?: string | number;
  delayYears: number;
}) {
  if (!active || !payload?.length) return null;

  const value = (key: string) =>
    payload.find((p) => p.dataKey === key)?.value ?? 0;

  return (
    <div className="border border-line-strong bg-canvas px-2 py-2">
      <p className="type-label text-ink">
        {label === 0 ? "Today" : `Year ${label}`}
      </p>
      <dl className="mt-1 flex flex-col gap-0.5">
        {[
          ["Rising 10% a year", value("stepUp")],
          ["Same amount every year", value("flat")],
          [`Starting ${delayYears} year later`, value("delayed")],
        ].map(([name, amount]) => (
          <div key={name as string} className="flex items-baseline gap-4">
            <dt className="type-label text-ink-muted">{name as string}</dt>
            <dd className="type-data ml-auto text-sm text-ink">
              {formatINR(rupeesToPaise(amount as number))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
