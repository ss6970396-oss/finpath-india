import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { inrToWords, rupeesToPaise } from "@/lib/money";

/**
 * @deprecated Legacy amount renderer. DELETE IN PHASE 3.
 *
 * Superseded by `components/ui/money.tsx`, which takes `Paise` and uses the
 * new type roles. This one survives only because the not-yet-rebuilt pages
 * pass float rupees; it converts at its own boundary so nothing downstream
 * sees a rupee float.
 */

type MoneySize = "sm" | "md" | "xl";

/** Amounts turn critical only when a rule has fired, never for emphasis. */
type MoneyTone = "default" | "accent" | "warn" | "danger";

const SIZES: Record<MoneySize, string> = {
  sm: "type-data text-sm",
  md: "type-data",
  xl: "type-data text-[2.125rem] leading-tight",
};

const TONES: Record<MoneyTone, string> = {
  default: "text-ink",
  accent: "text-ink",
  warn: "text-critical",
  danger: "text-critical",
};

export function Money({
  value,
  size = "md",
  tone = "default",
  showPaise = false,
  className,
}: {
  /** Float rupees — legacy call sites only. */
  value: number;
  size?: MoneySize;
  tone?: MoneyTone;
  showPaise?: boolean;
  className?: string;
}) {
  const amount = rupeesToPaise(value);
  return (
    <span className={cn(SIZES[size], TONES[tone], className)}>
      {/* Tabular glyphs are read digit by digit by a screen reader; §39
          requires the spoken form instead. */}
      <span aria-hidden="true">{formatINR(amount, showPaise)}</span>
      <span className="sr-only">{inrToWords(amount)}</span>
    </span>
  );
}
