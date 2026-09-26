"use client";

import * as React from "react";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Button, ButtonLink } from "./button";

/**
 * ActionCard — one thing to do.
 *
 * It is one of the few BORDERED blocks in the product, because it is
 * something the student acts on: paper ground, a 1px --line edge, square,
 * generous padding, no shadow.
 *
 *   title          one line, Inter medium
 *   explanation    why this, in at most two lines. An instruction without
 *                  a reason is advice; this product is education, so the
 *                  reason is always there. Clamped visually at two lines —
 *                  the full sentence stays in the DOM for a screen reader.
 *   priority       a badge with a WORD ("High priority"), never a colour
 *   minutes        "~5 min"
 *   action         a link (the fix lives elsewhere) or a button
 *   done           ticked, muted, and the button replaced by "Done"
 *
 * ONLY THE CARD ITS PARENT MARKS `primary` USES THE ACCENT BUTTON. A page
 * has one primary action; every other card's button is secondary, so a
 * list of three cards is never three equal shouts.
 */

export type ActionCardPriority = "high" | "medium" | "low";

export type ActionCardAction =
  | { label: string; href: string }
  | { label: string; onClick: () => void };

const PRIORITY_LABEL: Record<ActionCardPriority, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

export function ActionCard({
  title,
  explanation,
  priority,
  estimatedMinutes,
  action,
  done = false,
  primary = false,
  n,
  note,
  onMarkDone,
  onUndo,
  className,
}: {
  title: string;
  explanation: string;
  priority: ActionCardPriority;
  estimatedMinutes: number;
  action?: ActionCardAction;
  done?: boolean;
  /** The one card on the screen that carries the accent button. */
  primary?: boolean;
  /** Position in a numbered list, shown as "01". Not a score. */
  n?: number;
  /** A qualification that must be disclosed, e.g. "self-attested". */
  note?: string;
  /** Shown as a secondary "Mark as done" when the action is a link. */
  onMarkDone?: () => void;
  /** Offered on a done card, so a mis-tick can be reversed. */
  onUndo?: () => void;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex gap-4 border border-line bg-canvas p-6",
        done && "bg-surface",
        className,
      )}
    >
      {n !== undefined ? (
        <span aria-hidden="true" className="type-data amount-sm shrink-0 text-ink-muted">
          {String(n).padStart(2, "0")}
        </span>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Badge tone="neutral" icon={false}>
            {PRIORITY_LABEL[priority]}
          </Badge>
          <span className="type-label inline-flex items-center gap-1 text-ink-muted">
            <Clock className="lucide size-3.5 shrink-0" aria-hidden="true" />
            <span className="type-data">~{estimatedMinutes} min</span>
          </span>
        </div>

        <h3
          className={cn(
            "type-subhead font-medium",
            done ? "text-ink-muted line-through" : "text-ink",
          )}
        >
          {done ? <span className="sr-only-text">Done: </span> : null}
          {title}
        </h3>

        <p className="type-body line-clamp-2 prose-measure text-ink-secondary">
          {explanation}
        </p>

        {note ? <p className="type-label text-ink-muted">{note}</p> : null}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {done ? (
            <>
              <span className="type-label inline-flex min-h-10 items-center gap-1 text-ink">
                <Check className="lucide size-4" aria-hidden="true" />
                Done
              </span>
              {onUndo ? (
                <Button variant="quiet" size="sm" onClick={onUndo}>
                  Undo
                </Button>
              ) : null}
            </>
          ) : (
            <>
              {action ? (
                "href" in action ? (
                  <ButtonLink href={action.href} variant={primary ? "primary" : "secondary"}>
                    {action.label}
                  </ButtonLink>
                ) : (
                  <Button variant={primary ? "primary" : "secondary"} onClick={action.onClick}>
                    {action.label}
                  </Button>
                )
              ) : null}
              {onMarkDone ? (
                <Button variant="quiet" onClick={onMarkDone}>
                  Mark as done
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
