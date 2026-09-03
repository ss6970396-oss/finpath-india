import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DistributionBar (§7) — where the month's money went, as one horizontal
 * band rather than as a pie.
 *
 * WHY NOT A PIE. Reading a pie means comparing angles, which people do
 * badly; reading a stacked bar means comparing lengths against a shared
 * baseline, which people do well. It also degrades correctly: at 375px the
 * bar is still a bar, where a pie plus a legend is two objects fighting for
 * the same column.
 *
 * THE SEGMENTS ARE NOT COLOUR-CODED BY CATEGORY. Four brand hues would be
 * the fourth palette in a product that has one, and category colour is the
 * fastest way to make a financial screen look like a game. The segments are
 * steps of ink instead, and every one is labelled underneath with its name,
 * its amount and its share — the legend IS the data table, so there is
 * nothing to cross-reference.
 */

export type Slice = {
  key: string;
  label: string;
  /** Rupees, or any consistent unit. Shares are computed from the total. */
  value: number;
  /** Pre-formatted amount for the legend row. */
  display: React.ReactNode;
  /** Marks a segment as over its guideline. Adds a word, not just a hue. */
  flagged?: boolean;
  /** One line: what this bucket contains, or why it is flagged. */
  note?: string;
};

/**
 * Four steps of ink, darkest first. Ordering by weight rather than by hue
 * means the largest bucket is also the heaviest mark, which is the reading
 * the eye makes anyway.
 */
const STEPS = ["bg-ink", "bg-ink-secondary", "bg-ink-muted", "bg-ink-disabled"];

export function DistributionBar({
  slices,
  /** The denominator — monthly income. Segments are shares of this. */
  total,
  /** Rendered after the segments when spending is below income. */
  remainderLabel = "Not spent",
  className,
}: {
  slices: readonly Slice[];
  total: number;
  remainderLabel?: string;
  className?: string;
}) {
  const spent = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const denominator = total > 0 ? Math.max(total, spent) : spent;
  const share = (v: number) =>
    denominator > 0 ? Math.max(0, v) / denominator : 0;
  const remainder = Math.max(0, denominator - spent);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        aria-hidden="true"
        className="flex h-6 w-full overflow-hidden border border-line bg-surface-sunken"
      >
        {slices.map((slice, i) => {
          const width = share(slice.value);
          if (width <= 0) return null;
          return (
            <span
              key={slice.key}
              className={cn(
                STEPS[i % STEPS.length],
                i > 0 && "border-l border-canvas",
              )}
              style={{ width: `${width * 100}%` }}
            />
          );
        })}
      </div>

      {/* The legend IS the accessible table: each row names the bucket, its
          amount and its share, so the bar above adds shape and nothing the
          reader depends on. */}
      <dl className="flex flex-col">
        {slices.map((slice, i) => (
          <div
            key={slice.key}
            className="ledger-rule flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2"
          >
            <dt className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className={cn("size-3 shrink-0", STEPS[i % STEPS.length])}
              />
              <span className="type-label text-ink">{slice.label}</span>
              {slice.flagged ? (
                <span className="type-label text-critical">Above target</span>
              ) : null}
            </dt>
            <dd className="flex items-baseline gap-4">
              <span className="type-data text-sm text-ink-muted">
                {Math.round(share(slice.value) * 100)}%
              </span>
              {slice.display}
            </dd>
            {slice.note ? (
              <dd className="type-label w-full text-ink-muted">{slice.note}</dd>
            ) : null}
          </div>
        ))}

        {remainder > 0 ? (
          <div className="flex flex-wrap items-baseline justify-between gap-4 py-2">
            <dt className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 border border-line bg-surface-sunken"
              />
              <span className="type-label text-ink-muted">{remainderLabel}</span>
            </dt>
            <dd className="type-data text-sm text-ink-muted">
              {Math.round(share(remainder) * 100)}%
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
