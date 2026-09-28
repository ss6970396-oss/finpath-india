"use client";

import * as React from "react";
import { Input } from "@/components/ui";

/**
 * A rupee amount, typed by a person (§5).
 *
 * NOT `<input type="number">`. Three reasons, all of which show up on a
 * real phone: the spinner arrows are a 12px target beside a money field,
 * the scroll wheel silently changes the value when the page is scrolled
 * over it, and browsers accept "1e5" as valid. `inputMode="numeric"` gets
 * the numeric keypad without any of that.
 *
 * The text is held locally so the field can be EMPTY rather than being
 * forced through a literal 0 on every deletion — a zero someone has to
 * select and overwrite is the most annoying default in any money form.
 * Non-digits are dropped as they are typed, so the only error a field can
 * be in is "required and blank", which the caller decides and passes as
 * `error` (shown on blur and on Next, never mid-typing).
 *
 * `key` the field on the step id if a step ever needs to reset it; the
 * component deliberately does not sync from the prop afterwards, because
 * doing so overwrites a keystroke mid-edit.
 */
export const AmountField = React.forwardRef<
  HTMLInputElement,
  {
    label: string;
    description?: string;
    value: number;
    onValueChange: (value: number) => void;
    error?: string;
    onBlur?: () => void;
    autoFocus?: boolean;
  }
>(function AmountField(
  { label, description, value, onValueChange, error, onBlur, autoFocus },
  ref,
) {
  const [text, setText] = React.useState(value > 0 ? String(value) : "");

  return (
    <Input
      ref={ref}
      label={label}
      description={description}
      error={error}
      value={text}
      autoFocus={autoFocus}
      inputMode="numeric"
      autoComplete="off"
      numeric
      placeholder="0"
      onBlur={onBlur}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 9);
        setText(digits);
        onValueChange(digits === "" ? 0 : Number(digits));
      }}
    />
  );
});
