"use client";

import * as React from "react";
import { Field } from "@base-ui/react/field";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PasswordInput (§4).
 *
 * A password field with a reveal toggle, because the alternative — typing a
 * long passphrase blind on a phone keyboard — is what drives people to
 * short, guessable passwords. Making the good password typeable is a
 * security feature, not a convenience.
 *
 * Three details that are easy to get wrong and are handled here:
 *
 *   - the toggle is a real button with type="button", so Enter inside the
 *     field still submits the form rather than flipping visibility
 *   - its accessible name states the ACTION and the current state, so a
 *     screen-reader user knows the password is presently exposed
 *   - autoComplete is required from the caller. Getting it wrong is how a
 *     sign-up form ends up overwriting a saved password.
 */

export function PasswordInput({
  label,
  value,
  onValueChange,
  autoComplete,
  description,
  error,
  name,
  id: idProp,
  required,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  /** "current-password" for sign-in, "new-password" for sign-up and reset. */
  autoComplete: "current-password" | "new-password";
  description?: string;
  error?: string;
  name?: string;
  id?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const generated = React.useId();
  const id = idProp ?? generated;
  const [shown, setShown] = React.useState(false);

  return (
    <Field.Root
      invalid={Boolean(error)}
      className={cn("flex w-full flex-col gap-1", className)}
    >
      <Field.Label htmlFor={id} className="type-label text-ink">
        {label}
      </Field.Label>

      <div className="relative flex items-stretch">
        <Field.Control
          id={id}
          name={name}
          required={required}
          placeholder={placeholder}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onValueChange(e.target.value)
          }
          className={cn(
            "type-body w-full bg-canvas text-ink",
            "border border-line-strong py-2 pr-12 pl-2",
            "placeholder:text-ink-muted",
            "transition-colors duration-(--dur-fast) ease-(--ease-out)",
            "hover:bg-surface",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong",
            "data-invalid:border-critical",
          )}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className={cn(
            "absolute inset-y-0 right-0 flex w-10 items-center justify-center",
            "text-ink-secondary hover:text-ink",
            "transition-colors duration-(--dur-fast) ease-(--ease-out)",
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-line-strong",
          )}
        >
          {shown ? (
            <EyeOff className="lucide size-4" aria-hidden="true" />
          ) : (
            <Eye className="lucide size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {description && !error ? (
        <Field.Description className="type-label text-ink-muted">
          {description}
        </Field.Description>
      ) : null}

      {error ? (
        <Field.Error match className="type-label text-critical">
          {error}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}
