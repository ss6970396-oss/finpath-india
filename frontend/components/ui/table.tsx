"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Table (§17, §29).
 *
 * A real `<table>`: caption, scoped headers, `aria-sort`. A grid of divs
 * cannot be navigated by a screen-reader's table mode, and a ledger is
 * exactly the content that mode exists for.
 *
 * MOBILE IS NOT THIS COMPONENT'S JOB. §29 requires transactions to STACK
 * below 768px, not to scroll sideways — a table you have to drag is a table
 * you cannot read. Render `Table` at `md:` and up and a stacked list below;
 * `TableScroll` exists only for genuinely wide content on a wide screen.
 */

export function Table({
  caption,
  /**
   * Set false only when a visible heading immediately above the table says
   * the same thing — the caption still renders, just visually hidden.
   */
  showCaption = false,
  className,
  children,
}: {
  caption: string;
  showCaption?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <table className={cn("w-full border-collapse text-left", className)}>
      <caption
        className={cn(
          "type-label pb-2 text-left text-ink-muted",
          !showCaption && "sr-only-text",
        )}
      >
        {caption}
      </caption>
      {children}
    </table>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({
  className,
  children,
  ...props
}: React.ComponentProps<"tr">) {
  return (
    <tr className={cn("ledger-rule row-hover", className)} {...props}>
      {children}
    </tr>
  );
}

export type SortDirection = "ascending" | "descending" | "none";

/**
 * A header cell. When `onSort` is supplied it renders a real button inside
 * the `<th>` and sets `aria-sort` on the cell — which is where assistive
 * technology reads it from, not from the button.
 */
export function TH({
  numeric = false,
  sort,
  onSort,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"th">, "onSort"> & {
  numeric?: boolean;
  sort?: SortDirection;
  onSort?: () => void;
}) {
  const Icon =
    sort === "ascending" ? ArrowUp : sort === "descending" ? ArrowDown : ChevronsUpDown;

  return (
    <th
      scope="col"
      aria-sort={onSort ? (sort ?? "none") : undefined}
      className={cn(
        "type-label border-b border-line-strong px-2 py-2 font-medium text-ink",
        numeric && "text-right",
        className,
      )}
      {...props}
    >
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          className={cn(
            "inline-flex items-center gap-1 text-ink hover:text-ink-secondary",
            numeric && "flex-row-reverse",
          )}
        >
          {children}
          <Icon
            className={cn(
              "lucide size-3.5 shrink-0",
              sort && sort !== "none" ? "text-ink" : "text-ink-muted",
            )}
            aria-hidden="true"
          />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function TD({
  numeric = false,
  className,
  children,
  ...props
}: React.ComponentProps<"td"> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "type-body px-2 py-2 text-ink",
        numeric && "type-data text-right",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/**
 * A row header — the merchant, the document name. `scope="row"` is what
 * lets a screen reader say "Swiggy, amount, ₹340" instead of reading a
 * bare number with no subject.
 */
export function TRowHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"th">) {
  return (
    <th
      scope="row"
      className={cn("type-body px-2 py-2 font-normal text-ink", className)}
      {...props}
    >
      {children}
    </th>
  );
}

/**
 * Horizontal scroll for content that genuinely cannot stack. The page body
 * must never scroll sideways, so wide content scrolls inside its own box.
 * `tabIndex` makes it keyboard-reachable, which a scroll container needs
 * in order not to strand its contents.
 */
export function TableScroll({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn("w-full overflow-x-auto", className)}
    >
      {children}
    </div>
  );
}
