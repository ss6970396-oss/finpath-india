"use client";

import * as React from "react";
import { Toast as BaseToast } from "@base-ui/react/toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toast (§17).
 *
 * For confirming something that already happened — "42 transactions
 * imported", "Profile saved". Never for an error the user has to act on:
 * that belongs in an ErrorState next to the thing that failed, where it
 * stays put and can carry a retry.
 *
 * Base UI puts the viewport in a live region and keeps toasts focusable and
 * dismissible from the keyboard, which is what makes the pattern legitimate
 * rather than merely fashionable.
 */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseToast.Provider>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport
          className={cn(
            "fixed right-0 bottom-0 z-50 flex w-full flex-col gap-2 p-4",
            "sm:right-4 sm:bottom-4 sm:w-96 sm:p-0",
          )}
        >
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}

function ToastList() {
  const { toasts } = BaseToast.useToastManager();

  return toasts.map((toast) => {
    const critical = toast.type === "critical";
    return (
      <BaseToast.Root
        key={toast.id}
        toast={toast}
        className={cn(
          "w-full border bg-canvas",
          "transition-opacity duration-(--dur-base) ease-(--ease-out)",
          "data-starting-style:opacity-0 data-ending-style:opacity-0",
          critical ? "border-critical" : "border-line-strong",
        )}
      >
        <BaseToast.Content className="flex items-start justify-between gap-4 px-4 py-4">
          <div className="min-w-0 flex-1">
            <BaseToast.Title
              className={cn(
                "type-subhead",
                critical ? "text-critical" : "text-ink",
              )}
            />
            <BaseToast.Description className="type-body mt-1 text-ink-secondary" />
          </div>
          <BaseToast.Close
            aria-label="Dismiss"
            className="-m-1 shrink-0 border border-transparent p-1 text-ink-muted hover:border-line hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
          >
            <X className="lucide size-4" aria-hidden="true" />
          </BaseToast.Close>
        </BaseToast.Content>
      </BaseToast.Root>
    );
  });
}

/**
 * `const toast = useToast(); toast.add({ title: "Saved" })`.
 *
 * Re-exported from one place so call sites never import Base UI directly
 * and the styling above cannot be bypassed.
 */
export const useToast = BaseToast.useToastManager;
