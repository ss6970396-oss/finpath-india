import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Insight (§6, §7) — ONE finding, with the figure that makes it concrete
 * and a single route to the fix. Used for the Spending page's
 * recommended adjustment. It is deliberately not a list: a page showing
 * five opportunities has told the reader to choose, which is the work they
 * came here to have done. (One thing TO DO is an ActionCard, in
 * action-card.tsx.)
 *
 * Not a coloured panel. `tone="critical"` changes a border and adds a
 * WORD; it never fills a block with red — and overspending is not
 * critical at all (it renders with tone="default").
 */

export function Insight({
  eyebrow = "Your biggest opportunity",
  title,
  /** The figure, already rendered — a <Money> element, typically. */
  amount,
  /** What the figure is, in a few words: "could be redirected each month". */
  amountLabel,
  detail,
  action,
  tone = "default",
  className,
}: {
  eyebrow?: string;
  title: string;
  amount?: React.ReactNode;
  amountLabel?: string;
  detail: string;
  action?: React.ReactNode;
  tone?: "default" | "critical" | "positive";
  className?: string;
}) {
  const border =
    tone === "critical"
      ? "border-critical"
      : tone === "positive"
        ? "border-positive"
        : "border-line-strong";

  return (
    <section
      className={cn("flex flex-col gap-4 border-l-2 pl-4", border, className)}
    >
      <div className="flex flex-col gap-1">
        <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
        <h2 className="type-heading text-ink">{title}</h2>
      </div>

      {amount ? (
        <div className="flex flex-col gap-1">
          <span className="ledger-rule inline-flex w-fit pb-2">{amount}</span>
          {amountLabel ? (
            <span className="type-label text-ink-muted">{amountLabel}</span>
          ) : null}
        </div>
      ) : null}

      <p className="type-body prose-measure text-ink-secondary">{detail}</p>

      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </section>
  );
}

