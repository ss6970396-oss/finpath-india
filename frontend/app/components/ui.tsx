"use client";

import type { ReactNode } from "react";

/** Every rupee amount and percentage renders through this: monospace tabular. */
export function Figure({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`figure ${className}`}>{children}</span>;
}

/**
 * Three elevation levels, so a key stat, a content panel and a sub-block
 * inside a card stop reading as the same weight.
 *
 *   raised - key stat cards. The only thing on a page that advances.
 *   flat   - content panels. Border only; it recedes.
 *   inset  - sub-blocks within a card. Fill does the grouping, no border.
 */
export type CardVariant = "raised" | "flat" | "inset";

export function Card({
  children,
  className = "",
  variant = "flat",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
  as?: "div" | "section" | "article" | "li";
}) {
  const surface = {
    raised: "card-raised",
    flat: "card-flat",
    inset: "card-inset",
  }[variant];

  return <Tag className={`${surface} ${className}`}>{children}</Tag>;
}

export function CardHead({
  title,
  sub,
  right,
  className = "",
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 border-b border-rule-subtle px-5 py-4 ${className}`}
    >
      <div className="min-w-0">
        <h2 className="font-display text-xl leading-tight tracking-tight text-ink">
          {title}
        </h2>
        {sub && <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** Small uppercase label used above figures and on table headers. */
export function Label({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`eyebrow ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Tones name a MEANING, not a colour. the old sage/ochre/rust were colour names
 * wearing a semantic hat, which is how the same green ended up meaning
 * clickable, on-target and Savings all at once.
 */
export type Tone =
  | "neutral"
  | "positive"
  | "caution"
  | "critical"
  | "info"
  | "brand"
  | "leak";

const TONES: Record<Tone, string> = {
  neutral: "border-rule bg-surface-1 text-ink-muted",
  positive: "border-positive-border bg-positive-weak text-positive",
  caution: "border-caution-border bg-caution-weak text-caution",
  critical: "border-critical-border bg-critical-weak text-critical",
  info: "border-info-border bg-info-weak text-info",
  brand: "border-brand-border bg-brand-weak text-brand",
  // Micro-leakage is an observation, not an error. It takes the rose from the
  // data ramp precisely so it does NOT read as critical red.
  leak: "border-data-4 bg-transparent text-data-4",
};

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  ariaLabel,
  ariaPressed,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
  ariaPressed?: boolean;
}) {
  // min-h-10 meets the 40px control height; the touch target is padded to 44
  // via the surrounding hit area on chips (see the filter row).
  const base =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium " +
    "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] " +
    "disabled:cursor-not-allowed disabled:opacity-45";
  const styles = {
    primary:
      "bg-brand text-on-brand hover:bg-brand-hover active:bg-brand-press",
    secondary:
      "border border-rule-strong bg-surface-2 text-ink hover:bg-surface-hover active:bg-surface-3",
    ghost: "text-ink-muted hover:bg-surface-hover hover:text-ink",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

/** Horizontal meter with an optional target marker. */
/**
 * `fill` is a class, not a tone name, so a caller can pass either a status
 * colour (bg-positive) or a category identity colour (bg-data-2) without the
 * Meter having to know which kind of thing it is drawing.
 */
export function Meter({
  value,
  target,
  fill = "bg-brand",
}: {
  value: number; // 0-1+
  target?: number; // 0-1
  fill?: string;
}) {
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-1 ring-1 ring-inset ring-rule">
      <div
        className={`h-full ${fill} transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out)]`}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
      {target !== undefined && (
        <span
          aria-hidden="true"
          className="absolute top-0 h-full w-px bg-ink/45"
          style={{ left: `${Math.min(100, target * 100)}%` }}
        />
      )}
    </div>
  );
}

export function Empty({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-rule bg-surface-1 text-ink-muted">
        {icon}
      </span>
      <p className="mt-4 text-sm font-medium text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-muted">
        {body}
      </p>
    </div>
  );
}
