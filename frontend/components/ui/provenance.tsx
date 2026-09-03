import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Provenance (§28) — the line that says where the numbers on this screen
 * came from.
 *
 * This is the single most important piece of honesty in the product. A
 * projection built from a generated example month and one built from a real
 * bank statement render identically and mean entirely different things, and
 * the difference is invisible unless something says it out loud.
 *
 * So every page that renders a figure renders one of these, and it is
 * stated in the same words everywhere:
 *
 *   "Your uploaded statement"   actuals, parsed in this browser
 *   "The figures you entered"   the student's own declared estimate
 *   "An example month"          illustration only, and opt-in
 *
 * `action` is the way out — "Use my own figures", "Upload a statement" —
 * because telling someone their dashboard is an example without offering
 * the replacement is just a warning label.
 */

export function Provenance({
  /** The source phrase. Comes from SOURCE_LABEL, never written at a call site. */
  source,
  /** True for the generated example, which gets the stronger treatment. */
  illustrative = false,
  action,
  className,
}: {
  source: string;
  illustrative?: boolean;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "type-label flex flex-wrap items-center gap-x-2 gap-y-1",
        illustrative
          ? "border border-line-strong bg-surface px-2 py-1 text-ink"
          : "text-ink-muted",
        className,
      )}
    >
      <span>
        <span className="text-ink-muted">Based on: </span>
        {source}
      </span>
      {action}
    </p>
  );
}
