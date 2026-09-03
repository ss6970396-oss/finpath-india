"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Slider (§17) — a native `<input type="range">`, deliberately.
 *
 * A hand-built slider loses three things that matter more here than any
 * styling would gain: arrow-key stepping, Home/End, and the operating
 * system's own touch target on a phone. The What-If page is driven almost
 * entirely by these controls, so a student who cannot drag precisely — or
 * cannot drag at all — has to be able to reach every value from the
 * keyboard.
 *
 * The fill colour is pinned to the accent in globals.css via
 * `accent-color`, so it is not the browser's default blue.
 *
 * THE VALUE IS ALWAYS RENDERED AS TEXT beside the label. A slider whose
 * position is the only readout is a control you cannot check your work
 * against, and every value here is money.
 */

export function Slider({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  /** The current value, formatted. Shown beside the label, never derived here. */
  display,
  /** Endpoint captions under the track. Two strings, already formatted. */
  bounds,
  /** What this control changes, in one line. */
  description,
  /** Spoken value, when the raw number would be read unhelpfully. */
  valueText,
  disabled,
  className,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  display: React.ReactNode;
  bounds?: [React.ReactNode, React.ReactNode];
  description?: string;
  valueText?: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = React.useId();
  const describedBy = description ? `${id}-desc` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="type-label text-ink">
          {label}
        </label>
        <span className="type-data text-base text-ink">{display}</span>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-valuetext={valueText}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className="w-full disabled:cursor-not-allowed"
      />

      {bounds ? (
        <div className="flex items-baseline justify-between gap-2">
          <span className="type-data text-sm text-ink-muted">{bounds[0]}</span>
          <span className="type-data text-sm text-ink-muted">{bounds[1]}</span>
        </div>
      ) : null}

      {description ? (
        <p id={describedBy} className="type-label text-ink-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
