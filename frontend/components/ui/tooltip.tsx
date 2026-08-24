"use client";

import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "@/lib/utils";

/**
 * Tooltip (§17).
 *
 * A tooltip may only ever hold a LABEL for something already visible — the
 * expansion of an abbreviation, the name of an icon button. It must never
 * hold information the reader needs in order to act, because it is
 * unreachable on touch, invisible in print, and gone the moment focus moves.
 *
 * Provenance, rules and qualifications go in the margin (see MarginNote),
 * which is the entire reason that device exists. If you are reaching for a
 * tooltip to explain a number, the explanation belongs in the gutter.
 *
 * WCAG 2.2 SC 1.4.13: Base UI keeps the popup hoverable and dismissible
 * with Escape, which is what that criterion requires.
 */

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <BaseTooltip.Provider delay={400}>{children}</BaseTooltip.Provider>;
}

export function Tooltip({
  label,
  side = "top",
  children,
}: {
  /** Short. If it needs a sentence, it is not a tooltip. */
  label: string;
  side?: "top" | "bottom" | "left" | "right";
  /** The trigger. Must be focusable, or the tooltip is mouse-only. */
  children: React.ReactElement;
}) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={6} className="z-50">
          <BaseTooltip.Popup
            className={cn(
              "type-label max-w-56 border border-line-strong bg-ink px-2 py-1 text-canvas",
              "transition-opacity duration-(--dur-fast) ease-(--ease-out)",
              "data-starting-style:opacity-0 data-ending-style:opacity-0",
              "data-instant:transition-none",
            )}
          >
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
