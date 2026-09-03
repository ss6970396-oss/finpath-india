import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ScoreDial (§6, §26) — the one dominant figure on /home.
 *
 * §26 asks for a single primary visualisation rather than four equally
 * weighted boxes, and this is it: an open arc, drawn once, at a size
 * nothing else on the page competes with.
 *
 * WHY AN ARC AND NOT A RING. A closed ring reads as "percentage complete",
 * and a financial health score is not a completion. The 240° open arc has a
 * visible start and end, so the score reads as a POSITION ON A SCALE —
 * which is what it is, and which is why the band name ("Steady", "Needs
 * attention") is rendered as text rather than implied by the colour.
 *
 * ACCESSIBILITY. The whole thing is one img-role element with a written
 * label; the arc itself is aria-hidden. A screen reader gets the sentence,
 * not the geometry. The score, the band and the scale maximum are all
 * present as text on screen too, so nothing depends on reading an arc.
 *
 * The stroke is --accent, which is the one place in the product a brand
 * colour is allowed to be the largest element on a page: it is a position
 * indicator, not a status. When the score is in a band the product wants to
 * flag, the BAND WORD changes and a Badge beside it carries the status
 * colour — the arc never turns red.
 */

const SIZE = 240;
const STROKE = 14;
/** 240° of sweep, centred on the top. Leaves a visible gap at the bottom. */
const SWEEP = 240;

function polar(cx: number, cy: number, r: number, degrees: number) {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(fraction: number) {
  const r = (SIZE - STROKE) / 2;
  const c = SIZE / 2;
  const start = -SWEEP / 2;
  const end = start + SWEEP * Math.min(1, Math.max(0, fraction));
  const a = polar(c, c, r, start);
  const b = polar(c, c, r, end);
  const largeArc = SWEEP * fraction > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${largeArc} 1 ${b.x} ${b.y}`;
}

export function ScoreDial({
  score,
  max = 100,
  /** The band name — "Needs attention", "Steady", "Strong". Always shown. */
  band,
  /** One line under the band: what moved it, or what it measures. */
  caption,
  className,
}: {
  score: number;
  max?: number;
  band: string;
  caption?: string;
  className?: string;
}) {
  const rounded = Math.round(score);
  const fraction = max > 0 ? Math.min(1, Math.max(0, score / max)) : 0;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        role="img"
        aria-label={`Financial health score ${rounded} out of ${max}. ${band}.`}
        className="relative"
        style={{ width: SIZE, maxWidth: "100%" }}
      >
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE * 0.78}`}
          className="w-full"
          aria-hidden="true"
          focusable="false"
        >
          {/* The scale. Drawn first, so the score sits on top of it. */}
          <path
            d={arcPath(1)}
            fill="none"
            stroke="var(--color-surface-sunken)"
            strokeWidth={STROKE}
            strokeLinecap="butt"
          />
          {/* The position. */}
          <path
            d={arcPath(fraction)}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={STROKE}
            strokeLinecap="butt"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
          <span aria-hidden="true" className="type-data text-6xl text-ink">
            {rounded}
          </span>
          <span aria-hidden="true" className="type-label text-ink-muted">
            out of {max}
          </span>
        </div>
      </div>

      <p className="type-heading text-center text-ink">{band}</p>
      {caption ? (
        <p className="type-body prose-measure text-center text-ink-secondary">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
