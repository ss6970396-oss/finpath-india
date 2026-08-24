import * as React from "react";
import { cn } from "@/lib/utils";
import { Money } from "./money";
import type { Paise } from "@/lib/money";

/**
 * Metric (§17) — one figure, with the ledger hairline under it.
 *
 * The hairline is the product's signature and it CARRIES MEANING: "this is
 * a real number, and it came from somewhere". That is why `note` sits
 * directly beneath it — the rule separates the figure from its provenance,
 * which is the relationship the whole design is built around.
 *
 * Never render this without a `label`. A number with no name is the single
 * most common way a dashboard lies.
 */

export function Metric({
  label,
  amount,
  value,
  note,
  size = "lg",
  tone = "default",
  className,
}: {
  label: string;
  /** A rupee figure. Mutually exclusive with `value`. */
  amount?: Paise;
  /** A non-rupee figure — a score, a count, a percentage. Pre-formatted. */
  value?: React.ReactNode;
  /**
   * The provenance line: the rule behind the figure, or its as-of date.
   * "30% of ₹15,000". Optional, but a metric without one is usually a
   * metric nobody can check.
   */
  note?: React.ReactNode;
  size?: "md" | "lg" | "xl";
  tone?: "default" | "critical" | "positive";
  className?: string;
}) {
  const textTone =
    tone === "critical"
      ? "text-critical"
      : tone === "positive"
        ? "text-positive"
        : "text-ink";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="type-label text-ink-muted">{label}</span>

      <span className="ledger-rule pb-2">
        {amount !== undefined ? (
          <Money amount={amount} size={size === "md" ? "md" : size} tone={tone} />
        ) : (
          <span
            className={cn(
              "type-data",
              size === "xl" ? "text-4xl" : size === "lg" ? "text-2xl" : "text-base",
              textTone,
            )}
          >
            {value}
          </span>
        )}
      </span>

      {note ? <span className="type-label text-ink-muted">{note}</span> : null}
    </div>
  );
}

/**
 * A row of metrics. Deliberately capped at three: §26 forbids KPI overload,
 * and four tiles in a row is where a dashboard starts hiding its own point.
 */
export function MetricRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
