import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Section 11. The compliance copy lives here and nowhere else — import this,
 * never retype the sentence, so that a wording change is one edit and an
 * audit can grep a single file.
 *
 * Required on: every counsellor answer, /simulator, every goal card, every
 * nudge, and the dashboard hero. `synthetic` is additionally required as a
 * permanent (non-dismissible) line on /money and /money/import.
 */

export type DisclaimerVariant = "advice" | "projection" | "synthetic";

const COPY: Record<DisclaimerVariant, string> = {
  advice: "Education only. Not investment advice.",
  projection:
    "Illustrative compounding maths. Returns are not guaranteed.",
  synthetic:
    "Synthetic transaction data, generated for this prototype. Not a real bank account.",
};

export function DisclaimerNote({
  variant = "advice",
  withLink = true,
  className,
}: {
  variant?: DisclaimerVariant;
  /** Off only where the same block already links the disclaimer page. */
  withLink?: boolean;
  className?: string;
}) {
  return (
    <p className={cn("caption text-ink-muted", className)}>
      {COPY[variant]}
      {withLink ? (
        <>
          {" "}
          <Link
            href="/legal/disclaimer"
            className="underline underline-offset-2 hover:text-ink"
          >
            Read the full disclaimer
          </Link>
          .
        </>
      ) : null}
    </p>
  );
}
