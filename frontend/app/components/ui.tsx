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

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag className={`rounded-lg border border-line bg-surface ${className}`}>
      {children}
    </Tag>
  );
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
      className={`flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 ${className}`}
    >
      <div className="min-w-0">
        <h2 className="font-display text-xl leading-tight tracking-tight text-ink">
          {title}
        </h2>
        {sub && <p className="mt-1 text-[13px] leading-relaxed text-meta">{sub}</p>}
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
      className={`text-[11px] font-medium uppercase tracking-[0.08em] text-meta ${className}`}
    >
      {children}
    </span>
  );
}

type Tone = "neutral" | "sage" | "ochre" | "rust";

const TONES: Record<Tone, string> = {
  neutral: "border-line bg-surface-2 text-meta",
  sage: "border-sage-line bg-sage text-sage-ink",
  ochre: "border-ochre/30 bg-ochre-tint text-ochre-ink",
  rust: "border-rust/30 bg-rust-tint text-rust",
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
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45";
  const styles = {
    primary: "bg-forest text-on-forest hover:bg-forest-hover",
    secondary:
      "border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2",
    ghost: "text-meta hover:bg-surface-2 hover:text-ink",
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
export function Meter({
  value,
  target,
  tone = "sage",
}: {
  value: number; // 0-1+
  target?: number; // 0-1
  tone?: "sage" | "ochre" | "rust";
}) {
  const fill = {
    sage: "bg-forest",
    ochre: "bg-ochre",
    rust: "bg-rust",
  }[tone];

  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-line">
      <div
        className={`h-full ${fill}`}
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
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface-2 text-meta">
        {icon}
      </span>
      <p className="mt-4 text-sm font-medium text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-meta">
        {body}
      </p>
    </div>
  );
}
