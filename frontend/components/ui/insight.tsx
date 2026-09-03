import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Insight and ActionCard (§6, §7).
 *
 * These two carry the product's whole argument, so the rules they encode
 * are worth stating.
 *
 * INSIGHT is the "biggest opportunity" block: ONE finding, with the figure
 * that makes it concrete and a single route to the fix. It is deliberately
 * not a list. A page showing five opportunities has told the reader to
 * choose, which is the work they came here to have done.
 *
 * ACTIONCARD is one thing to do. It carries a `why` because an instruction
 * without a reason is advice, and this product is education: the student
 * has to be able to disagree with the reasoning, which means seeing it.
 *
 * Neither is a coloured panel. `tone="critical"` changes a border and adds
 * a WORD; it never fills a card with red. A screen that turns red when the
 * numbers are ordinary is a screen people stop opening.
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

/**
 * One action. `n` is the position in the plan, not a priority score — it is
 * rendered because a numbered list of three is legible and a bulleted list
 * of three is wallpaper.
 */
export function ActionCard({
  n,
  title,
  why,
  /** Where the action is carried out, or the tick that records it. */
  action,
  /** True when nothing in the data can confirm this — always disclosed. */
  selfAttested = false,
  done = false,
  className,
}: {
  n?: number;
  title: string;
  why: string;
  action?: React.ReactNode;
  selfAttested?: boolean;
  done?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex gap-4 border border-line bg-surface px-4 py-4",
        done && "bg-transparent",
        className,
      )}
    >
      {n !== undefined ? (
        <span
          aria-hidden="true"
          className="type-data shrink-0 text-sm text-ink-muted"
        >
          {String(n).padStart(2, "0")}
        </span>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3
          className={cn(
            "type-subhead",
            done ? "text-ink-muted line-through" : "text-ink",
          )}
        >
          {title}
        </h3>
        <p className="type-body prose-measure text-ink-secondary">{why}</p>
        {selfAttested ? (
          <p className="type-label text-ink-muted">
            Nothing in your statement can confirm this one — ticking it is
            your own record.
          </p>
        ) : null}
        {action ? <div className="flex flex-wrap gap-2 pt-1">{action}</div> : null}
      </div>
    </article>
  );
}
