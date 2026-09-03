"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Segmented control (§17) — a small, mutually exclusive choice that changes
 * what a nearby figure or chart MEANS: a 10/20/30-year horizon, a monthly
 * or yearly view.
 *
 * It is a radio group, not a row of buttons. That is not pedantry: a screen
 * reader announces "3 of 3, thirty years" for a radio group and "button"
 * for the alternative, and only the radio group gives arrow-key movement
 * between the options — which is what a sighted mouse user gets for free by
 * seeing them side by side.
 *
 * The selected segment is marked by an ink fill AND by `aria-checked`,
 * never by colour alone.
 */

export type Segment<T extends string> = {
  value: T;
  label: string;
  /** Spoken name where the visible label is an abbreviation ("10y"). */
  spoken?: string;
};

export function Segmented<T extends string>({
  label,
  segments,
  value,
  onValueChange,
  size = "md",
  className,
}: {
  /** Names the group. Visually hidden unless `showLabel`. */
  label: string;
  segments: readonly Segment<T>[];
  value: T;
  onValueChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const last = segments.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = index === last ? 0 : index + 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = index === 0 ? last : index - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    onValueChange(segments[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex border border-line-strong", className)}
    >
      {segments.map((segment, i) => {
        const selected = segment.value === value;
        return (
          <button
            key={segment.value}
            ref={(node) => {
              refs.current[i] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={segment.spoken}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(segment.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "type-label whitespace-nowrap",
              "transition-colors duration-(--dur-fast) ease-(--ease-out)",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-line-strong",
              i > 0 && "border-l border-line-strong",
              size === "sm" ? "px-2 py-1" : "px-4 py-2",
              selected
                ? "bg-ink font-semibold text-canvas"
                : "bg-transparent text-ink-secondary hover:bg-surface hover:text-ink",
            )}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
