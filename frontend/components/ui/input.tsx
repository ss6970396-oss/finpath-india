"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { cn } from "@/lib/utils";

/**
 * Input (§17), built on Base UI's Field so the label, description and error
 * are wired to the control by the library rather than by hand — which is
 * what §39's "accessible errors" actually requires: `aria-describedby` to
 * the message, `aria-invalid` on the control, and both surviving re-render.
 *
 * The control border is --line-strong. --line is 1.24:1 and would fail
 * WCAG 2.2 SC 1.4.11 for a component boundary.
 */

const CONTROL = [
  "type-body w-full bg-canvas text-ink",
  "border border-line-strong px-2 py-2",
  "placeholder:text-ink-muted",
  "transition-colors duration-(--dur-fast) ease-(--ease-out)",
  "hover:bg-surface",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong",
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken disabled:text-ink-disabled",
  "data-invalid:border-critical",
].join(" ");

export type InputProps = React.ComponentProps<"input"> & {
  label: string;
  /** Helper text. Rendered below the control and linked by aria-describedby. */
  description?: string;
  /** Validation message. Its presence is what puts the field in the error state. */
  error?: string;
  /**
   * Hide the label visually but keep it for screen readers. For a search box
   * whose purpose is obvious from context — never as a way to avoid writing
   * a label.
   */
  hideLabel?: boolean;
  /** Right-aligned tabular numerals, for amounts and quantities. */
  numeric?: boolean;
};

export function Input({
  label,
  description,
  error,
  hideLabel = false,
  numeric = false,
  className,
  ...props
}: InputProps) {
  return (
    <Field.Root
      // `invalid` drives data-invalid on the control, so the error styling
      // and aria-invalid cannot drift apart from the message being shown.
      invalid={Boolean(error)}
      className="flex w-full flex-col gap-1"
    >
      <Field.Label
        className={cn("type-label text-ink", hideLabel && "sr-only-text")}
      >
        {label}
      </Field.Label>

      <Field.Control
        className={cn(CONTROL, numeric && "type-data text-right", className)}
        {...props}
      />

      {description && !error ? (
        <Field.Description className="type-label text-ink-muted">
          {description}
        </Field.Description>
      ) : null}

      {error ? (
        // §39: the message is not colour-only. It carries the word itself,
        // and the border change is a second, redundant signal.
        //
        // `match` drives visibility off the field's own ValidityState;
        // passing it bare (`true`) hands that decision to the caller, which
        // is what we want here — the message is server- or form-supplied,
        // not derived from a constraint the browser can see for itself.
        <Field.Error match className="type-label text-critical">
          {error}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}

/**
 * A bare input for use inside a composed control (a table filter, a search
 * bar with its own label). Everything with a visible label should use
 * `Input` instead, so the wiring is not re-done by hand each time.
 */
export function BareInput({
  numeric = false,
  className,
  ...props
}: React.ComponentProps<"input"> & { numeric?: boolean }) {
  return (
    <input
      className={cn(CONTROL, numeric && "type-data text-right", className)}
      {...props}
    />
  );
}
