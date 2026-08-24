"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sheet (§17) — an edge-anchored panel.
 *
 * This is the mobile answer to two specific problems §29 raises:
 *   - ledger filters, which must not be crammed into a toolbar at 375px
 *   - secondary navigation, which must not push the page sideways
 *
 * Built on Dialog rather than on a separate drawer primitive, because it
 * needs exactly the same guarantees — focus trap, Escape, restore — and one
 * less API to keep in step is worth more than a slide gesture.
 *
 * `side="bottom"` is the default: on a phone the bottom edge is the only
 * one within thumb reach.
 */

type Side = "bottom" | "right";

const SIDES: Record<Side, string> = {
  bottom:
    "inset-x-0 bottom-0 max-h-[85dvh] w-full border-t data-starting-style:translate-y-4 data-ending-style:translate-y-4",
  right:
    "inset-y-0 right-0 h-dvh w-[calc(100vw-3rem)] max-w-md border-l data-starting-style:translate-x-4 data-ending-style:translate-x-4",
};

export function Sheet({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  side = "bottom",
  footer,
  children,
  className,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  side?: Side;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger render={trigger as React.ReactElement} /> : null}

      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-40 min-h-dvh bg-ink/20",
            "transition-opacity duration-(--dur-base) ease-(--ease-out)",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
          )}
        />

        <Dialog.Popup
          className={cn(
            "fixed z-50 flex flex-col overflow-y-auto",
            "border-line-strong bg-canvas",
            "transition-[opacity,translate] duration-(--dur-base) ease-(--ease-out)",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
            SIDES[side],
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-4">
            <div className="min-w-0">
              <Dialog.Title className="type-subhead text-ink">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="type-label mt-1 text-ink-muted">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              aria-label="Close"
              // 44px hit area: this is the primary dismiss on a phone.
              className="-m-2 shrink-0 border border-transparent p-2 text-ink-muted hover:border-line hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
            >
              <X className="lucide size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="flex-1 px-4 py-4">{children}</div>

          {footer ? (
            <div className="border-t border-line px-4 py-4">{footer}</div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
