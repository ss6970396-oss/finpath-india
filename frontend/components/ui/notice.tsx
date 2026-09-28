import * as React from "react";
import { CircleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Notice — a calm inline note.
 *
 * Not a panel, and not red by default. A 2px rule down the left edge, a
 * glyph, a short title and a sentence — the way a book sets a note in the
 * text. It is for things the reader should know and may act on: a rate
 * limit, an answer that was cut short, how accounts work on this build.
 *
 *   neutral   information. Ink rule, ink title. The default, and right
 *             for almost everything — including a failed request, which
 *             is an inconvenience, not an alarm.
 *   critical  a real problem the reader must fix before going on: a file
 *             that could not be read, credentials that did not match.
 *             The title and rule take --critical; the body stays ink, so
 *             the note is never a wall of red. Always a word and a glyph.
 *
 * `live` announces it politely when it appears; `alert` interrupts, and is
 * reserved for the critical case the reader is about to correct.
 */
export function Notice({
  tone = "neutral",
  title,
  children,
  action,
  announce,
  className,
}: {
  tone?: "neutral" | "critical";
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  /** "polite" for a note that appears after an action; "alert" for errors to fix. */
  announce?: "polite" | "alert";
  className?: string;
}) {
  const critical = tone === "critical";
  const Glyph = critical ? CircleAlert : Info;

  return (
    <div
      role={announce === "alert" ? "alert" : undefined}
      aria-live={announce === "polite" ? "polite" : undefined}
      className={cn(
        "flex flex-col gap-1 border-l-2 py-1 pl-4",
        critical ? "border-critical" : "border-ink",
        className,
      )}
    >
      {title ? (
        <p
          className={cn(
            "type-subhead inline-flex items-center gap-2",
            critical ? "text-critical" : "text-ink",
          )}
        >
          <Glyph className="lucide size-4 shrink-0" aria-hidden="true" />
          {title}
        </p>
      ) : null}
      {children ? (
        <div className="type-body prose-measure text-ink-secondary">{children}</div>
      ) : null}
      {action ? <div className="flex flex-wrap gap-2 pt-2">{action}</div> : null}
    </div>
  );
}
