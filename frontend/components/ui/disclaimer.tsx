import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The compliance copy lives here and NOWHERE ELSE.
 *
 * Import this; never retype the sentence at a call site. A wording change
 * then becomes one edit, and an audit asking "does every projection carry a
 * disclaimer" becomes one grep instead of a reading of the whole app.
 *
 * Required on: every coach answer, every projection or scenario, every
 * plan stage, and the /home hero. `example` is additionally required
 * wherever the generated month is in force.
 */

export type DisclaimerVariant = "advice" | "projection" | "example";

const COPY: Record<DisclaimerVariant, string> = {
  advice:
    "FinPath provides educational and planning information and is not a substitute for personalised financial advice.",
  projection:
    "Illustrative compounding maths at a fixed assumed rate. Real returns vary and are not guaranteed.",
  example:
    "These figures come from a generated example month, not from your own account.",
};

export function DisclaimerNote({
  variant = "advice",
  withLink = false,
  className,
}: {
  variant?: DisclaimerVariant;
  /** On only where the block does not already sit beside the footer link. */
  withLink?: boolean;
  className?: string;
}) {
  return (
    <p className={cn("type-label prose-measure text-ink-muted", className)}>
      {COPY[variant]}
      {withLink ? (
        <>
          {" "}
          <Link
            href="/sources"
            className="underline underline-offset-2 hover:text-ink"
          >
            How we work this out
          </Link>
          .
        </>
      ) : null}
    </p>
  );
}
