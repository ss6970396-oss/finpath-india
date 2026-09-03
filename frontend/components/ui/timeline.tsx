import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Timeline (§10) — the vertical roadmap on /plan.
 *
 * Vertical, not horizontal. A horizontal stepper implies the stages take
 * comparable time; these do not — clearing a card can take a month and
 * building three months of buffer can take two years — and a horizontal
 * layout at 375px is a scroll or a squeeze. Vertical also lets each stage
 * carry its own actions without the row height fighting its neighbours.
 *
 * The connecting line is drawn between the markers, not through them, so
 * the last stage does not trail a line into whitespace.
 *
 * STATUS IS NEVER COLOUR ALONE (§23). A complete stage shows a tick glyph;
 * the stage asking for attention is the only one with a filled ink marker
 * and it also says "Now" in words. An upcoming stage is outlined and says
 * "Later".
 */

export type TimelineStatus = "complete" | "attention" | "upcoming";

const STATUS_WORD: Record<TimelineStatus, string> = {
  complete: "Done",
  attention: "Now",
  upcoming: "Later",
};

export function Timeline({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ol className={cn("flex flex-col", className)}>{children}</ol>;
}

export function TimelineStage({
  n,
  title,
  purpose,
  status,
  /** Progress meter, metrics, actions — whatever the stage needs. */
  children,
  /** True for the last stage, so the connector stops. */
  last = false,
  className,
}: {
  n: number;
  title: string;
  purpose?: string;
  status: TimelineStatus;
  children?: React.ReactNode;
  last?: boolean;
  className?: string;
}) {
  return (
    <li className={cn("relative flex gap-4", className)}>
      {/* The rail. */}
      <div className="flex flex-col items-center">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center border",
            status === "complete"
              ? "border-positive bg-positive-wash text-positive"
              : status === "attention"
                ? "border-line-strong bg-ink text-canvas"
                : "border-line bg-canvas text-ink-muted",
          )}
        >
          {status === "complete" ? (
            <Check className="lucide size-4" />
          ) : (
            <span className="type-data text-sm">{String(n).padStart(2, "0")}</span>
          )}
        </span>
        {!last ? (
          <span aria-hidden="true" className="w-px flex-1 bg-line" />
        ) : null}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col gap-4", last ? "pb-0" : "pb-8")}>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="type-heading text-ink">{title}</h2>
            <span
              className={cn(
                "type-eyebrow",
                status === "attention" ? "text-ink" : "text-ink-muted",
              )}
            >
              {STATUS_WORD[status]}
            </span>
          </div>
          {purpose ? (
            <p className="type-body prose-measure text-ink-secondary">
              {purpose}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </li>
  );
}
