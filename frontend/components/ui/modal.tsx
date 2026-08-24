"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * Modal (§17).
 *
 * Base UI's Dialog: focus trap, restore-on-close, Escape, `aria-modal`,
 * and the title/description wiring. None of that is worth re-implementing.
 *
 * Square, bordered with --line-strong. There is no shadow available to lift
 * an overlay off the page, so the border and the backdrop do that work —
 * which is why the border here is the strong weight even though a card's
 * is not.
 *
 * Use sparingly. A modal interrupts; most of what gets built as a modal is
 * better as a page or a Sheet.
 */

export function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  children,
  className,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  /** Required when the modal asks for a decision — say what it commits to. */
  description?: string;
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
            "fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "flex w-[calc(100vw-2rem)] max-w-lg flex-col",
            "max-h-[calc(100dvh-4rem)] overflow-y-auto",
            "border border-line-strong bg-canvas",
            "transition-opacity duration-(--dur-base) ease-(--ease-out)",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-4">
            <div className="min-w-0">
              <Dialog.Title className="type-heading text-ink">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="type-body mt-1 text-ink-secondary">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              aria-label="Close"
              className="shrink-0 border border-transparent p-1 text-ink-muted hover:border-line hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
            >
              <X className="lucide size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {children ? <div className="px-4 py-4">{children}</div> : null}

          {footer ? (
            <div className="border-t border-line px-4 py-4">{footer}</div>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * The close control, for a footer that needs its own dismiss button next to
 * the confirming action.
 */
export function ModalClose({
  children = "Cancel",
}: {
  children?: React.ReactNode;
}) {
  return <Dialog.Close render={<Button variant="quiet">{children}</Button>} />;
}
