"use client";

import * as React from "react";
import Link from "next/link";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

/**
 * Menu (§17) — the header's account dropdown, and nothing else so far.
 *
 * Base UI rather than a hand-rolled popover: a menu has real semantics
 * (roving focus, typeahead, Escape, click-outside, focus return to the
 * trigger) and every hand-rolled one loses at least two of them.
 *
 * A menu holds ACTIONS and DESTINATIONS. It is not a place to hide primary
 * navigation — the five nav items stay visible at every width, and this
 * carries only the account items.
 */

const POPUP = [
  "z-50 min-w-56 border border-line-strong bg-canvas py-1",
  "origin-(--transform-origin)",
  "transition-opacity duration-(--dur-fast) ease-(--ease-out)",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
].join(" ");

const ITEM = [
  "type-label flex w-full cursor-default items-center gap-2 px-4 py-2 text-left",
  "text-ink-secondary outline-none select-none",
  "data-highlighted:bg-surface data-highlighted:text-ink",
].join(" ");

export function Menu({
  trigger,
  label,
  children,
  align = "end",
}: {
  /** The trigger element. Rendered as-is; give it its own accessible name. */
  trigger: React.ReactElement;
  /** Names the menu for assistive technology. */
  label: string;
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          align={align}
          sideOffset={8}
          className="z-50 outline-none"
        >
          <BaseMenu.Popup aria-label={label} className={POPUP}>
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

/** A heading inside the menu — the signed-in identity, typically. */
export function MenuHeading({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="border-b border-line px-4 py-2">
      <p className="type-label text-ink">{title}</p>
      {detail ? (
        <p className="type-label truncate text-ink-muted">{detail}</p>
      ) : null}
    </div>
  );
}

/**
 * A destination. `LinkItem` rather than `Item` with an onClick: it renders a
 * real anchor, so middle-click, ctrl-click and "open in new tab" work and a
 * screen reader announces "link" rather than "menu item". `closeOnClick`
 * because the menu is meaningless once the page under it has changed.
 */
export function MenuLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <BaseMenu.LinkItem
      className={ITEM}
      closeOnClick
      render={<Link href={href} />}
    >
      {children}
    </BaseMenu.LinkItem>
  );
}

export function MenuAction({
  onClick,
  tone = "default",
  children,
}: {
  onClick: () => void;
  tone?: "default" | "critical";
  children: React.ReactNode;
}) {
  return (
    <BaseMenu.Item
      onClick={onClick}
      className={cn(ITEM, tone === "critical" && "text-critical")}
    >
      {children}
    </BaseMenu.Item>
  );
}

export function MenuSeparator() {
  return <BaseMenu.Separator className="my-1 h-px bg-line" />;
}
