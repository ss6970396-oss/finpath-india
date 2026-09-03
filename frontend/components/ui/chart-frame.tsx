import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ChartFrame (§18, §23) — everything that has to be true around a chart,
 * so no chart has to remember it.
 *
 * A Recharts surface on its own is an unlabelled canvas: it has no title,
 * no statement of what it assumes, and nothing a screen reader can read.
 * This wraps it with the three things that make a chart honest:
 *
 *   1. ONE INSIGHT, in words, above the plot. §18: "surface one insight at
 *      a time." If the reader takes nothing but this sentence away, they
 *      should still have the point.
 *   2. THE ASSUMPTIONS, under the plot. A projection with an unstated rate
 *      is a promise. Pass the rate, the horizon and the word
 *      "illustrative" — the caller owns the wording because only the caller
 *      knows the figures.
 *   3. THE DATA, as a real table, visually hidden but announced. This is
 *      the accessible alternative WCAG asks for, and it is also what makes
 *      the numbers copyable.
 *
 * The plot itself is aria-hidden — a screen reader reading out SVG path
 * coordinates is worse than silence, and the table above is the answer.
 */

export type ChartSeries = {
  /** Column heading in the accessible table. */
  label: string;
  /** Already-formatted cell values, aligned with `rowLabels`. */
  values: readonly string[];
};

export function ChartFrame({
  title,
  /** The single sentence the chart is making. Rendered as prose, not a caption. */
  insight,
  /** What the plot assumes. Always includes the word "illustrative" for a projection. */
  assumptions,
  /** Row headings of the accessible table — years, months, categories. */
  rowLabels,
  rowHeader = "Period",
  series,
  /** Controls that change the plot — a Segmented horizon toggle, say. */
  controls,
  children,
  className,
}: {
  title: string;
  insight?: React.ReactNode;
  assumptions?: React.ReactNode;
  rowLabels: readonly string[];
  rowHeader?: string;
  series: readonly ChartSeries[];
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 className="type-subhead text-ink">{title}</h3>
          {insight ? (
            <p className="type-body prose-measure mt-1 text-ink-secondary">
              {insight}
            </p>
          ) : null}
        </div>
        {controls ? <div className="shrink-0">{controls}</div> : null}
      </div>

      <div aria-hidden="true" className="w-full">
        {children}
      </div>

      <figcaption className="flex flex-col gap-2">
        {assumptions ? (
          <p className="type-label prose-measure text-ink-muted">
            {assumptions}
          </p>
        ) : null}

        <table className="sr-only-text">
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">{rowHeader}</th>
              {series.map((s) => (
                <th key={s.label} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((row, i) => (
              <tr key={row}>
                <th scope="row">{row}</th>
                {series.map((s) => (
                  <td key={s.label}>{s.values[i] ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
