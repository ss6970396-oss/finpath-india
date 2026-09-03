"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Checkbox and Choice (§5, §10).
 *
 * Both wrap a REAL native input rather than styling a div. The native
 * control brings the space-bar toggle, the form value, the browser's own
 * "required" handling and, on iOS, the correct hit target — none of which
 * survive a hand-built substitute, and all of which a student uses without
 * ever knowing they exist.
 *
 * The visible box is drawn beside the hidden input and marked aria-hidden,
 * so the state is announced once (by the input) rather than twice.
 *
 * `Choice` is the tile form used in onboarding: the whole card is the
 * label, so the target is the card and not a 16px square. Selection is
 * marked by a 2px ink border AND a tick, never by colour alone.
 */

export function Checkbox({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  label: React.ReactNode;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "group flex cursor-pointer items-start gap-2",
        disabled && "cursor-not-allowed",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="peer sr-only-text"
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center border",
          "transition-colors duration-(--dur-fast) ease-(--ease-out)",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-line-strong",
          checked
            ? "border-line-strong bg-ink text-canvas"
            : "border-line-strong bg-canvas",
          disabled && "border-line bg-surface-sunken",
        )}
      >
        {checked ? <Check className="lucide size-3" /> : null}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="type-label text-ink">{label}</span>
        {description ? (
          <span className="type-label text-ink-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function Choice({
  label,
  description,
  checked,
  onSelect,
  /** "checkbox" for many-of, "radio" for one-of. Drives the semantics. */
  type = "checkbox",
  name,
  className,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onSelect: (checked: boolean) => void;
  type?: "checkbox" | "radio";
  /** Required for radio groups, so the browser knows they are exclusive. */
  name?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-start gap-4 border px-4 py-4",
        "transition-colors duration-(--dur-fast) ease-(--ease-out)",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-line-strong",
        checked
          ? "border-line-strong bg-surface"
          : "border-line bg-transparent hover:bg-surface",
        className,
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={(e) => onSelect(e.target.checked)}
        className="sr-only-text"
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center border",
          checked
            ? "border-line-strong bg-ink text-canvas"
            : "border-line-strong bg-canvas",
        )}
      >
        {checked ? <Check className="lucide size-3" /> : null}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="type-subhead text-ink">{label}</span>
        {description ? (
          <span className="type-body text-ink-secondary">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
