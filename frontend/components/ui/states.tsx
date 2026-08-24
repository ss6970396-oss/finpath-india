import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * EmptyState, LoadingState, ErrorState (§17, §42).
 *
 * Every data surface in FinPath has all three. A blank screen is not a
 * state, it is an omission, and it is the point at which a student decides
 * the product is broken.
 *
 * The rules these encode:
 *   loading  static neutral blocks. NO SHIMMER — an animated placeholder
 *            fakes activity, and under prefers-reduced-motion it has to
 *            stop anyway, so it was never load-bearing.
 *   empty    say what is missing, say what to do, provide the action.
 *   error    say what failed, and offer a retry.
 */

/* ----------------------------------------------------------------- empty */

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  /** What is missing and why the screen is blank. Not an apology. */
  description: string;
  /** At least one route forward. An empty state with no action is a dead end. */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 border border-line bg-surface px-4 py-8",
        className,
      )}
    >
      <h3 className="type-subhead text-ink">{title}</h3>
      <p className="type-body prose-measure text-ink-secondary">{description}</p>
      {action ? <div className="mt-2 flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

/* --------------------------------------------------------------- loading */

/**
 * One static placeholder block. Sized by the caller so the layout does not
 * jump when the real content lands.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-4 w-full bg-surface-sunken", className)}
    />
  );
}

/**
 * A loading region. `aria-busy` plus a polite live message, so the wait is
 * announced once rather than the placeholder blocks being read out as
 * meaningless empty elements.
 */
export function LoadingState({
  label = "Loading",
  lines = 3,
  className,
}: {
  label?: string;
  lines?: number;
  className?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn("flex flex-col gap-2", className)}
    >
      <span className="sr-only-text">{label}</span>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          // Ragged widths so the block reads as text-shaped rather than as
          // a grey rectangle, without animating anything.
          className={i === lines - 1 ? "w-1/2" : i % 2 === 0 ? "w-full" : "w-5/6"}
        />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- error */

export function ErrorState({
  title = "That didn't load",
  /**
   * What actually failed, in a sentence the reader can act on. Pass the
   * real reason — lib/api.ts already produces one. "Something went wrong"
   * is the message that costs the most debugging time.
   */
  detail,
  onRetry,
  retryLabel = "Try again",
  className,
}: {
  title?: string;
  detail: string;
  onRetry?: React.ReactNode;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-2 border border-critical bg-critical-wash px-4 py-4",
        className,
      )}
    >
      <h3 className="type-subhead text-critical">{title}</h3>
      <p className="type-body prose-measure text-ink">{detail}</p>
      {onRetry ? <div className="mt-2">{onRetry}</div> : <span className="sr-only-text">{retryLabel}</span>}
    </div>
  );
}
