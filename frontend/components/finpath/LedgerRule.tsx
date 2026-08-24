import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Money } from "./Money";

/**
 * THE signature element (Section 3.1). A label on the left, a tabular mono
 * amount on the right, and a 1px hairline underneath running the full width
 * of the container — a passbook entry.
 *
 * The hairline means "this is a real number". It is the one decorative-looking
 * mark in the product that is not decoration, which is why nothing else in the
 * app may draw a rule: no underlines beneath headings, no divider flourishes.
 * Every money surface composes from this.
 */

export type LedgerTone = "default" | "warn" | "accent";

const AMOUNT_TONE = {
  default: "default",
  warn: "warn",
  accent: "accent",
} as const;

const RULE_TONE: Record<LedgerTone, string> = {
  // The rule itself stays a hairline in every tone; only a fired rule
  // recolours it, and only because the state is real (Section 3.2).
  default: "bg-rule",
  warn: "bg-warn",
  accent: "bg-accent",
};

export function LedgerRule({
  label,
  amount,
  secondary,
  tone = "default",
  size = "md",
  className,
}: {
  label: ReactNode;
  amount: number;
  /** Right-hand context: "34% of ₹12,500", a date, a count. */
  secondary?: ReactNode;
  tone?: LedgerTone;
  size?: "md" | "xl";
  className?: string;
}) {
  // The hero takes the geometry from the Section 6.1 wireframe: the label on
  // its own line, then the amount with its context pushed to the right margin.
  // Sharing one line with a 34px figure clips the label at 390px.
  if (size === "xl") {
    return (
      <div className={cn("w-full", className)}>
        <p className="label-ui text-ink-muted">{label}</p>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-2 pt-1">
          <Money value={amount} size="xl" tone={AMOUNT_TONE[tone]} />
          {secondary ? (
            <span className="caption text-ink-muted">{secondary}</span>
          ) : null}
        </div>
        <div aria-hidden="true" className={cn("h-px w-full", RULE_TONE[tone])} />
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-4 pb-1.5">
        <span className="label-ui min-w-0 truncate text-ink-muted">{label}</span>
        <span className="flex shrink-0 items-baseline gap-3">
          {secondary ? (
            <span className="caption text-ink-muted">{secondary}</span>
          ) : null}
          <Money value={amount} size="md" tone={AMOUNT_TONE[tone]} />
        </span>
      </div>
      <div aria-hidden="true" className={cn("h-px w-full", RULE_TONE[tone])} />
    </div>
  );
}

/**
 * A list of entries sharing one column grid — the transaction ledger and the
 * spending split. Rows are separated by the same hairline, never by striping.
 */
export function LedgerList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>;
}
