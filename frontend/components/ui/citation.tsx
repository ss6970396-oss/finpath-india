"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Citation (§34) — the inline `[1]` marker.
 *
 * THE RULE: no citation, no substantive regulatory claim. Anything the
 * product says about RBI, SEBI, a government scheme, a financial rule, a
 * limit or a regulatory requirement carries one of these, and activating it
 * takes the reader to the retrieved clause verbatim.
 *
 * It is a real `<button>`, not a superscript span: it does something, so it
 * must be reachable by keyboard and announced as actionable. The accessible
 * name is the whole reference — "Source 1: collegestudents.pdf, page 14" —
 * because "1" on its own tells a screen-reader user nothing.
 *
 * Activating it scrolls the SourcePanel to that entry and marks it. It does
 * NOT open a modal: the sources are the point, and putting them behind a
 * dismissible overlay says they are an afterthought.
 */

export function Citation({
  n,
  source,
  page,
  onActivate,
  active = false,
  className,
}: {
  /** The number as it appears in the answer text. 1-based. */
  n: number;
  /** The document this refers to. */
  source: string;
  page?: number;
  onActivate?: (n: number) => void;
  /** True while the source panel is showing this entry. */
  active?: boolean;
  className?: string;
}) {
  const where = page !== undefined ? `${source}, page ${page}` : source;
  return (
    <button
      type="button"
      onClick={() => onActivate?.(n)}
      aria-label={`Source ${n}: ${where}`}
      aria-current={active ? "true" : undefined}
      className={cn(
        "type-data mx-0.5 inline-flex min-w-5 items-center justify-center border px-1 align-baseline text-sm",
        "transition-colors duration-(--dur-fast) ease-(--ease-out)",
        active
          ? "border-line-strong bg-ink text-canvas"
          : "border-line bg-surface text-ink-secondary hover:border-line-strong hover:text-ink",
        className,
      )}
    >
      {n}
    </button>
  );
}

/**
 * The unverified marker.
 *
 * When retrieval finds nothing close enough, the backend answers from
 * general knowledge and tags the response `mode: "general"`. That answer
 * carries NO citations — and it must say so in words, not by the absence of
 * chips, which a reader cannot notice.
 */
export function UnverifiedNote({ className }: { className?: string }) {
  return (
    <p className={cn("type-label text-ink-muted", className)}>
      Not from a verified source. This answer comes from general knowledge,
      not from the regulatory corpus, so check any figure against the
      regulator&rsquo;s latest circular.
    </p>
  );
}
