import { cn } from "@/lib/utils";
import { formatINR, inrToWords } from "@/lib/money";

type MoneySize = "sm" | "md" | "xl";

/** Amounts turn `warn` only when a rule has fired, never for emphasis. */
type MoneyTone = "default" | "accent" | "warn" | "danger";

const SIZES: Record<MoneySize, string> = {
  sm: "tnum text-[0.8125rem] leading-[1.385]",
  md: "amount",
  xl: "amount-xl",
};

const TONES: Record<MoneyTone, string> = {
  default: "text-ink",
  accent: "text-accent",
  warn: "text-warn",
  danger: "text-danger",
};

export function Money({
  value,
  size = "md",
  tone = "default",
  showPaise = false,
  className,
}: {
  value: number;
  size?: MoneySize;
  tone?: MoneyTone;
  showPaise?: boolean;
  className?: string;
}) {
  return (
    <span className={cn(SIZES[size], TONES[tone], className)}>
      {/* The glyphs are tabular so a screen reader would read them digit by
          digit. Section 10 requires the spoken form instead. */}
      <span aria-hidden="true">{formatINR(value, showPaise)}</span>
      <span className="sr-only">{inrToWords(value)}</span>
    </span>
  );
}
