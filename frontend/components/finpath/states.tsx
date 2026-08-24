import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Section 7. Every screen ships loading, empty, error and populated. These are
 * the three that are not the populated case, built as real components so a
 * screen cannot quietly skip one.
 */

/* ------------------------------------------------------------------ empty */

/**
 * State the fact, give one sentence of direction, offer exactly one action.
 * `action` is deliberately a single node, not a list — two primary buttons in
 * an empty state means the screen has not decided what the next step is.
 */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-16", className)}>
      <div className="mx-auto max-w-md">
        <p className="display-md text-ink">{title}</p>
        <p className="body-base mt-2 text-ink-muted">{body}</p>
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ error */

/**
 * Name what failed, in the voice of the interface, and offer the retry.
 * No apology, no "Oops", no stack trace — Section 7 rejects all three.
 */
export function ErrorState({
  title,
  detail,
  onRetry,
  retryLabel = "Try again",
  className,
}: {
  title: string;
  detail?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border border-rule bg-danger-weak px-4 py-3",
        className,
      )}
    >
      <p className="label-ui text-danger">{title}</p>
      {detail ? <p className="caption mt-1 text-ink-muted">{detail}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="label-ui mt-3 rounded-sm text-accent underline underline-offset-2 hover:text-ink"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------- permission / locked */

/** Section 7: explain the requirement and link the fix. Never a bare padlock. */
export function LockedState({
  title,
  requirement,
  action,
  className,
}: {
  title: string;
  requirement: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-rule bg-surface px-4 py-4",
        className,
      )}
    >
      <p className="label-ui text-ink">{title}</p>
      <p className="caption mt-1 text-ink-muted">{requirement}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

/* --------------------------------------------------------------- loading */

/**
 * A static block, not a shimmer. Section 7: a still skeleton reads calmer, and
 * an animated one competes with the one orchestrated motion in the product
 * (the Opportunity Cost Ribbon).
 *
 * The fill is `rule`, not `surface`. Section 3.4 puts cards on `surface`, so a
 * surface-filled skeleton is invisible on exactly the ground it most often
 * loads into. `rule` is the only other neutral in the palette.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("rounded-sm bg-rule", className)} />
  );
}

/**
 * Skeletons must match the geometry of what replaces them, so these presets
 * mirror real components rather than being generic grey bars.
 */
export function LoadingSkeleton({
  variant = "card",
  rows = 4,
  className,
}: {
  variant?: "card" | "ledger" | "prose";
  rows?: number;
  className?: string;
}) {
  if (variant === "ledger") {
    return (
      <div
        className={cn("flex flex-col gap-4", className)}
        role="status"
        aria-label="Loading"
      >
        {Array.from({ length: rows }, (_, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-between gap-4 pb-1.5">
              <Skeleton className="h-[13px] w-28" />
              <Skeleton className="h-[15px] w-20" />
            </div>
            {/* The hairline is real even while the number is not. */}
            <div className="h-px w-full bg-rule" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "prose") {
    return (
      <div
        className={cn("prose-column flex flex-col gap-3", className)}
        role="status"
        aria-label="Loading"
      >
        <Skeleton className="h-[30px] w-2/3" />
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton
            key={i}
            className={cn("h-[17px]", i === rows - 1 ? "w-1/2" : "w-full")}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-rule bg-paper p-4 md:p-6",
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <Skeleton className="h-[11px] w-24" />
      <Skeleton className="mt-4 h-[38px] w-44" />
      <div className="mt-4 h-px w-full bg-rule" />
      <Skeleton className="mt-4 h-[15px] w-2/3" />
    </div>
  );
}

/* --------------------------------------------------------------- offline */

/** Section 7. A hairline bar at the top of the viewport, never a modal. */
export function OfflineBar({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="caption border-b border-rule bg-warn-weak px-4 py-1.5 text-center text-warn"
    >
      You are offline. Showing your last saved data.
    </div>
  );
}
