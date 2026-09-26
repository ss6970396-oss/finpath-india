"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ProgressMeter (§17) — a bar with a target on it.
 *
 * Not a progress bar. The thing a student needs to see is not "how far
 * along am I" but "where am I against the line", so the target marker is
 * the primary element and the fill is context for it.
 *
 * Accessibility: this is a `meter`, not a `progressbar` — the value sits
 * within a known range with a meaningful threshold, which is exactly the
 * distinction the two roles draw. The state is also stated in text next to
 * the bar, so nothing depends on reading a 6px band of colour (§39).
 *
 * OVER TARGET IS INFORMATION, NOT AN ERROR. The fill is the accent (it is
 * progress, one of the accent's four jobs) up to the target line; anything
 * past the line is drawn in muted ink as a separate segment, and the status
 * sentence says "above" in words. Nothing turns red: a meter that goes
 * red for ordinary spending teaches people to stop reading it.
 */

export function ProgressMeter({
  label,
  /** 0–1. Values above 1 render as an overflow segment rather than clipping. */
  value,
  /** 0–1. The line the value is measured against, e.g. 0.30 for the Wants rule. */
  target,
  /** Right-hand context: the amount, or "30% of ₹15,000". */
  detail,
  /** Shown beside the bar. Must state the condition in words. */
  status,
  className,
}: {
  label: string;
  value: number;
  target?: number;
  detail?: React.ReactNode;
  status?: string;
  className?: string;
}) {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  const over = target !== undefined && safe > target;

  // The track shows 0..max where max makes both the value and the target
  // visible; a value of 16x its target would otherwise render as a full bar
  // with no information in it.
  const max = Math.max(1, safe, target ?? 0);
  const pctOf = (n: number) => `${Math.min(100, (n / max) * 100)}%`;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="type-label text-ink">{label}</span>
        {detail ? <span className="type-data amount-sm text-ink-secondary">{detail}</span> : null}
      </div>

      <div
        role="meter"
        aria-label={label}
        aria-valuenow={Math.round(safe * 100)}
        aria-valuemin={0}
        aria-valuemax={Math.round(max * 100)}
        aria-valuetext={
          status ? `${Math.round(safe * 100)} percent, ${status}` : undefined
        }
        className="relative h-2 w-full border border-line bg-surface-sunken"
      >
        <div
          className="absolute inset-y-0 left-0 bg-accent"
          style={{ width: pctOf(over ? (target ?? safe) : safe) }}
        />

        {over && target !== undefined ? (
          // The overflow: the part past the line, in muted ink, so the ink
          // target line stays visible against it.
          <div
            aria-hidden="true"
            className="absolute inset-y-0 bg-ink-muted"
            style={{
              left: pctOf(target),
              width: `calc(${pctOf(safe)} - ${pctOf(target)})`,
            }}
          />
        ) : null}

        {target !== undefined ? (
          // The target line. 2px of ink, full height, sitting above the
          // fill — the one thing on the bar that never moves.
          <div
            aria-hidden="true"
            className="absolute inset-y-0 w-0.5 bg-line-strong"
            style={{ left: pctOf(target) }}
          />
        ) : null}
      </div>

      {status ? (
        <span
          className={cn(
            "type-label",
            over ? "text-ink" : "text-ink-muted",
          )}
        >
          {status}
        </span>
      ) : null}
    </div>
  );
}
