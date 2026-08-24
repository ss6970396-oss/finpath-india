"use client";

import * as React from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

/**
 * Tabs (§17).
 *
 * Used for the second level of navigation under a PageHeader — Ledger and
 * Import under Spending, the four simulators under Simulators. The sidebar
 * stays one level deep and tabs carry the rest, so the reader always knows
 * which of two hierarchies they are moving in.
 *
 * The active tab is marked by a 2px ink underline AND by weight, never by
 * colour alone (§39). At narrow widths the list scrolls horizontally
 * INSIDE ITSELF — the page body must never scroll sideways.
 */

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  label,
  children,
  className,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Names the tab set for assistive technology. "Spending views". */
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BaseTabs.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(String(next))}
      aria-label={label}
      className={cn("flex flex-col gap-4", className)}
    >
      {children}
    </BaseTabs.Root>
  );
}

export function TabList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <BaseTabs.List
      className={cn(
        "flex w-full gap-4 overflow-x-auto border-b border-line",
        className,
      )}
    >
      {children}
    </BaseTabs.List>
  );
}

export function Tab({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <BaseTabs.Tab
      value={value}
      className={cn(
        "type-label -mb-px shrink-0 whitespace-nowrap border-b-2 border-transparent px-1 py-2",
        "text-ink-muted transition-colors duration-(--dur-fast) ease-(--ease-out)",
        "hover:text-ink",
        // Weight and rule together, so the state survives greyscale.
        "data-selected:border-line-strong data-selected:font-semibold data-selected:text-ink",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong",
        className,
      )}
    >
      {children}
    </BaseTabs.Tab>
  );
}

export function TabPanel({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <BaseTabs.Panel value={value} className={cn("outline-none", className)}>
      {children}
    </BaseTabs.Panel>
  );
}
