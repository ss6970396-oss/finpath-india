import * as React from "react";
import { Check, Minus, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Badge (§17) — a status marker.
 *
 * TWO RULES, both from §39 and §36.
 *
 * 1. Status is never colour alone. Every toned badge carries a glyph as
 *    well as its wash, so it survives greyscale, colour-blindness, and a
 *    printed page. This matters more here than usual: --positive and
 *    --critical sit 1.21:1 apart in luminance, so the two washes are close
 *    to indistinguishable without the glyph.
 *
 * 2. The label describes a CONDITION, never a person. "Above target", not
 *    "overspender". The component cannot enforce that, but it is the
 *    reason `critical` is named for the state and not for a judgement.
 */

type Tone = "neutral" | "positive" | "critical";

const TONES: Record<Tone, { box: string; Icon: React.ElementType | null }> = {
  neutral: {
    box: "border-line bg-surface text-ink-secondary",
    Icon: null,
  },
  positive: {
    box: "border-positive bg-positive-wash text-positive",
    Icon: Check,
  },
  critical: {
    box: "border-critical bg-critical-wash text-critical",
    Icon: TriangleAlert,
  },
};

export function Badge({
  tone = "neutral",
  icon = true,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  tone?: Tone;
  /** Set false only where an adjacent glyph already carries the state. */
  icon?: boolean;
}) {
  const { box, Icon } = TONES[tone];
  return (
    <span
      className={cn(
        "type-label inline-flex items-center gap-1 border px-2 py-0.5",
        box,
        className,
      )}
      {...props}
    >
      {icon && Icon ? (
        <Icon className="lucide size-3.5 shrink-0" aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}

/**
 * The dot form, for a table cell where a full badge would crowd the row.
 * The label is still rendered — the dot is redundant reinforcement, never
 * the only carrier of the state.
 */
export function StatusDot({
  tone = "neutral",
  label,
  className,
}: {
  tone?: Tone;
  label: string;
  className?: string;
}) {
  const { Icon } = TONES[tone];
  const Glyph = Icon ?? Minus;
  const colour =
    tone === "positive"
      ? "text-positive"
      : tone === "critical"
        ? "text-critical"
        : "text-ink-muted";
  return (
    <span className={cn("inline-flex items-center gap-1", colour, className)}>
      <Glyph className="lucide size-3.5 shrink-0" aria-hidden="true" />
      <span className="type-label">{label}</span>
    </span>
  );
}
