import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PageHeader (§20, §41).
 *
 * Every /app page opens with one. The `purpose` line is not decoration: §41
 * requires each page to have a single responsibility, and writing that
 * responsibility into the header is what keeps it honest — if the sentence
 * needs an "and", the page is doing two jobs.
 *
 * Exactly one `<h1>` per page, and it lives here.
 */

export function PageHeader({
  title,
  purpose,
  actions,
  children,
  className,
}: {
  title: string;
  /** One sentence. What this page is for. */
  purpose?: string;
  actions?: React.ReactNode;
  /** Second-level navigation — a TabList — sits under the rule. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="type-display text-ink">{title}</h1>
          {purpose ? (
            <p className="type-body prose-measure mt-2 text-ink-secondary">
              {purpose}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </header>
  );
}

/**
 * A section within a page. The heading is serif; the rule under it is
 * structural, not a ledger hairline — a heading is not an amount, and
 * drawing the ledger rule here would spend the signature on decoration.
 */
export function Section({
  id,
  title,
  description,
  actions,
  children,
  className,
}: {
  /** Anchor target, when something links to this section by name. */
  id?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
        <div className="min-w-0">
          <h2 className="type-heading text-ink">{title}</h2>
          {description ? (
            <p className="type-label mt-1 text-ink-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
