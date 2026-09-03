import { cn } from "@/lib/utils";

/**
 * Stepper (§5) — the onboarding progress indicator.
 *
 * Three things it must do, and each one is a thing students abandon
 * onboarding for the lack of:
 *
 *   say how many steps there are IN TOTAL, up front. "Step 3" with no
 *   denominator is an interview of unknown length.
 *   name the current step, so the bar is not the only signal.
 *   be announceable — this is a progressbar with a value, so a screen
 *   reader gets the same "three of eight" a sighted user gets.
 *
 * The segments are ticks, not chips: eight labelled circles at 390px is a
 * horizontal scroll, and the label of a step nobody has reached is noise.
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
  /** The current step's own title. */
  label: string;
  className?: string;
}) {
  const clamped = Math.min(Math.max(current, 1), total);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="type-eyebrow text-ink-muted">
          Step {clamped} of {total}
        </span>
        <span className="type-label text-right text-ink-secondary">{label}</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={clamped}
        aria-valuetext={`Step ${clamped} of ${total}: ${label}`}
        className="flex w-full gap-1"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "h-1 flex-1",
              "transition-colors duration-(--dur-base) ease-(--ease-out)",
              i < clamped ? "bg-ink" : "bg-surface-sunken",
            )}
          />
        ))}
      </div>
    </div>
  );
}
