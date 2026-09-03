"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Button (§17).
 *
 * Square, bordered, no shadow. The variants are a hierarchy of *commitment*,
 * not of decoration:
 *
 *   primary    the one action the page exists for. Ink fill, canvas text.
 *   secondary  a real alternative. Bordered, transparent.
 *   quiet      navigation and reversible actions. No border until hover.
 *   critical   destructive and irreversible. The only coloured button, and
 *              it must always be confirmed elsewhere.
 *
 * A page has at most one primary button. If two things look equally
 * important, neither is.
 *
 * The border weight is deliberate: every interactive boundary takes
 * --line-strong (13.92:1), never --line (1.24:1), which would fail
 * WCAG 2.2 SC 1.4.11.
 */

export type ButtonVariant = "primary" | "secondary" | "quiet" | "critical";
type Variant = ButtonVariant;
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border border-line-strong bg-ink text-canvas hover:bg-ink-secondary active:bg-ink",
  secondary:
    "border border-line-strong bg-transparent text-ink hover:bg-surface active:bg-surface-sunken",
  quiet:
    "border border-transparent bg-transparent text-ink-secondary hover:border-line hover:bg-surface hover:text-ink active:bg-surface-sunken",
  critical:
    "border border-critical bg-critical text-canvas hover:bg-critical/90 active:bg-critical",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-2 gap-1",
  md: "h-10 px-4 gap-2",
};

/**
 * The shared shape. Exported so `ButtonLink` can wear it without a second
 * copy of the variant table — a link that only *looks* like a button is
 * how the two drift apart.
 */
export function buttonClass(
  variant: Variant = "secondary",
  size: Size = "md",
  className?: string,
) {
  return cn(
    "type-label inline-flex select-none items-center justify-center whitespace-nowrap",
    "transition-colors duration-(--dur-fast) ease-(--ease-out)",
    "disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-ink-disabled",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  /**
   * Swaps the label for a status line and disables the control. The label
   * stays in the DOM as the accessible name so focus is not orphaned, and
   * the width does not collapse mid-action.
   */
  loading?: boolean;
  loadingLabel?: string;
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  loadingLabel = "Working…",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      // aria-disabled rather than only `disabled`, so the reason stays
      // announceable while loading; `disabled` still blocks activation.
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {loading ? (
        <>
          <span aria-hidden="true">{loadingLabel}</span>
          <span className="sr-only-text">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * A row of buttons. Right-aligned by default, because that is where the
 * commitment lives in a form; `align="start"` for toolbars.
 */
export function ButtonRow({
  align = "end",
  className,
  children,
}: {
  align?: "start" | "end";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        align === "end" ? "justify-end" : "justify-start",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A NAVIGATION that looks like a button.
 *
 * It is an `<a>`, not a button with an onClick that pushes a route. That
 * distinction is the difference between middle-click, ctrl-click, "open in
 * new tab", the status bar showing where it goes, and a screen reader
 * announcing "link" — none of which a button can offer, and all of which
 * someone expects from something that takes them elsewhere.
 */
export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
  variant?: Variant;
  size?: Size;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
