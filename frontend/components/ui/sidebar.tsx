"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Navigation primitives (§20): the Sidebar, the phone bottom bar, and the
 * one rule for which item is "current".
 *
 * §20: "Do not rely on icons alone." Every item shows its text label at
 * every width. The icon is supporting and is `aria-hidden`, because a
 * screen reader announcing "chart icon, Spending" is worse than "Spending".
 *
 * The active item is marked THREE ways — an ink indicator bar, ink text at
 * a heavier weight, and `aria-current="page"`. None of them is colour.
 */

export type NavItem = {
  href: string;
  label: string;
  icon?: React.ElementType;
  /**
   * Other routes this item stands for — a page that is not in the nav
   * itself but belongs under this item, so the bar still says where you
   * are. /spending and /what-if sit under Home.
   */
  also?: readonly string[];
};

/**
 * True when `path` belongs to `item`: its own route, a child of it, or a
 * route it covers through `also`. Segment-exact, so /plan never matches
 * /planner.
 */
export function isNavActive(item: NavItem, path: string): boolean {
  const owns = (href: string) => path === href || path.startsWith(`${href}/`);
  return owns(item.href) || (item.also ?? []).some(owns);
}

export function Sidebar({
  items,
  currentPath,
  footer,
  className,
}: {
  items: readonly NavItem[];
  /** Compared with `href` (and `also`) to mark the active item. */
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
            <SidebarLink item={item} active={isNavActive(item, currentPath)} />
          </li>
        ))}
      </ul>
      {footer ? <div className="px-4 pt-4">{footer}</div> : null}
    </nav>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "type-label flex items-center gap-2 border-l-2 px-4 py-2",
        "transition-colors duration-(--dur-fast) ease-(--ease-out)",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
        active
          ? "border-ink bg-surface font-semibold text-ink"
          : "border-transparent text-ink-secondary hover:bg-surface hover:text-ink",
      )}
    >
      {Icon ? <Icon className="lucide size-4 shrink-0" aria-hidden="true" /> : null}
      {item.label}
    </Link>
  );
}

/**
 * The phone bottom bar. Bottom rather than top because on a phone that is
 * the only edge within thumb reach.
 *
 * Paper ground, a hairline above, a label under every icon, and a 2px ink
 * bar over the current item. Each target is at least 44 × 44px (WCAG 2.2
 * SC 2.5.8 asks for 24; 44 is the platform guidance, and a thumb is not a
 * cursor). `safe-bottom` keeps the labels clear of the home indicator on
 * phones without a bottom bezel — it needs `viewportFit: "cover"`, which
 * the root layout sets.
 */
export function MobileNav({
  items,
  currentPath,
  className,
}: {
  /** Five at most — four is the product's number. */
  items: readonly NavItem[];
  currentPath: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Main"
      className={cn(
        "safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas",
        className,
      )}
    >
      <ul className="flex">
        {items.map((item) => {
          const active = isNavActive(item, currentPath);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "type-label flex min-h-14 min-w-11 flex-1 flex-col items-center justify-center gap-1 border-t-2 px-1 py-2",
                  "transition-colors duration-(--dur-fast) ease-(--ease-out)",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                  active
                    ? "border-ink font-semibold text-ink"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {Icon ? <Icon className="lucide size-5" aria-hidden="true" /> : null}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
