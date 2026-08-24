"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Sidebar (§20).
 *
 * Seven categories, one level deep. Second-level routes are Tabs under the
 * PageHeader, not children here — so the reader always knows which of two
 * hierarchies they are moving in.
 *
 * §20: "Do not rely on icons alone." Every item shows its text label at
 * every width. The icon is supporting and is `aria-hidden`, because a
 * screen reader announcing "chart icon, Spending" is worse than "Spending".
 *
 * The active item is marked THREE ways — a 2px ink bar, semibold weight,
 * and `aria-current="page"`. None of them is colour.
 */

export type NavItem = {
  href: string;
  label: string;
  icon?: React.ElementType;
};

export function Sidebar({
  items,
  currentPath,
  footer,
  className,
}: {
  items: readonly NavItem[];
  /** Compared with `href` to mark the active item. */
  currentPath: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <nav
      aria-label="Main"
      className={cn(
        "flex h-full w-60 shrink-0 flex-col justify-between border-r border-line bg-canvas py-4",
        className,
      )}
    >
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.href}>
            <SidebarLink item={item} currentPath={currentPath} />
          </li>
        ))}
      </ul>
      {footer ? <div className="px-4 pt-4">{footer}</div> : null}
    </nav>
  );
}

function SidebarLink({
  item,
  currentPath,
}: {
  item: NavItem;
  currentPath: string;
}) {
  // Exact match for the overview root, prefix match for everything else, so
  // /app/spending/ledger still lights up Spending without /app matching all.
  const active =
    item.href === "/app"
      ? currentPath === "/app"
      : currentPath.startsWith(item.href);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "type-label flex items-center gap-2 border-l-2 px-4 py-2",
        "transition-colors duration-(--dur-fast) ease-(--ease-out)",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-line-strong",
        active
          ? "border-line-strong bg-surface font-semibold text-ink"
          : "border-transparent text-ink-secondary hover:bg-surface hover:text-ink",
      )}
    >
      {Icon ? <Icon className="lucide size-4 shrink-0" aria-hidden="true" /> : null}
      {item.label}
    </Link>
  );
}

/**
 * The mobile counterpart: a fixed bottom bar for the most-used
 * destinations. Bottom rather than top because on a phone that is the only
 * edge within thumb reach; 44px minimum targets throughout.
 */
export function MobileNav({
  items,
  currentPath,
  className,
}: {
  /** Five at most. Everything else lives behind a Sheet. */
  items: readonly NavItem[];
  currentPath: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Main"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-canvas",
        className,
      )}
    >
      {items.map((item) => {
        const active =
          item.href === "/app"
            ? currentPath === "/app"
            : currentPath.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "type-label flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 px-1 py-2",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-line-strong",
              active
                ? "border-line-strong font-semibold text-ink"
                : "border-transparent text-ink-muted",
            )}
          >
            {Icon ? <Icon className="lucide size-4" aria-hidden="true" /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
