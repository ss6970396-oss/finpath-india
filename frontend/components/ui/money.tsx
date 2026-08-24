import { cn } from "@/lib/utils";
import { formatCompactINR, formatINR } from "@/lib/format";
import { inrToWords, type Paise } from "@/lib/money";

/**
 * Money (§14) — the render boundary for every rupee figure in the product.
 *
 * Nothing else may format an amount. A component that builds its own rupee
 * string skips two things this one guarantees:
 *
 *   the tabular figures a ledger needs to align, and
 *   the spoken label a screen reader needs to say "four thousand two
 *   hundred eighty rupees" instead of "four two eight zero".
 *
 * It takes `Paise`, so a float rupee cannot reach the screen without an
 * explicit, greppable conversion first.
 */

type MoneySize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<MoneySize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
  xl: "text-4xl",
};

export function Money({
  amount,
  size = "md",
  /** Show the paisa. For a statement line or an export, not for a headline. */
  withPaise = false,
  /**
   * Lakh/crore abbreviation. CHART AXES AND DENSE CELLS ONLY — a rounded
   * figure misstates precision. The spoken label stays exact either way, so
   * a screen-reader user is never given the abbreviated version.
   */
  compact = false,
  /**
   * Amounts turn critical only when a rule has actually fired. Never for
   * emphasis, and never merely because a number is large.
   */
  tone = "default",
  className,
}: {
  amount: Paise;
  size?: MoneySize;
  withPaise?: boolean;
  compact?: boolean;
  tone?: "default" | "muted" | "critical" | "positive";
  className?: string;
}) {
  const tones = {
    default: "text-ink",
    muted: "text-ink-muted",
    critical: "text-critical",
    positive: "text-positive",
  } as const;

  return (
    <span className={cn("type-data", SIZES[size], tones[tone], className)}>
      <span aria-hidden="true">
        {compact ? formatCompactINR(amount) : formatINR(amount, withPaise)}
      </span>
      <span className="sr-only-text">{inrToWords(amount)}</span>
    </span>
  );
}
