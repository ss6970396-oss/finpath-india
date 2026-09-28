import { cn } from "@/lib/utils";

/**
 * Stepper (§5) — the onboarding progress indicator.
 *
 * Three things it must do, and each one is a thing students abandon
 * onboarding for the lack of:
 *
 *   say how many steps there are IN TOTAL, up front. "Step 3" with no
 *   denominator is an interview of unknown length.
 *   show how far along you are at a glance: one thin bar, filled in the
 *   accent — progress is one of the accent's four jobs.
 *   be announceable — this is a progressbar with a value, so a screen
 *   reader gets the same "three of eight" a sighted user gets.
 *
 * The count is in words ("Step 3 of 8") so the bar is never the only
 * signal. The step's own title is the page's h1, directly below, so it is
 * not repeated here.
 */

export function Stepper({
  current,
  total,
  label,
  className,
}: {
  /** 1-based. */
  current: number;
  total: number;
  /** The current step's own title, for the spoken value. */
  label: string;
  className?: string;
}) {
  const clamped = Math.min(Math.max(current, 1), total);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="type-eyebrow text-ink-muted">
        Step {clamped} of {total}
      </span>

      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={clamped}
        aria-valuetext={`Step ${clamped} of ${total}: ${label}`}
        className="h-1 w-full bg-surface-sunken"
      >
        <div
          aria-hidden="true"
          className="h-full bg-accent transition-[width] duration-(--dur-base) ease-(--ease-out)"
          style={{ width: `${(clamped / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
