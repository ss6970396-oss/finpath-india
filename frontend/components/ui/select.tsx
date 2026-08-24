"use client";

import * as React from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Select (§17).
 *
 * Base UI's Select rather than a native `<select>`: the popup has to be a
 * square, token-styled surface, and a native control cannot be styled to
 * match on Windows without losing its keyboard behaviour. Base UI keeps
 * the full listbox semantics — roving focus, typeahead, aria-activedescendant.
 */

export type SelectItem<T extends string> = {
  value: T;
  label: string;
  /** Optional second line — a figure, a qualification. */
  detail?: string;
};

export type SelectProps<T extends string> = {
  label: string;
  items: readonly SelectItem<T>[];
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  hideLabel?: boolean;
  className?: string;
};

export function Select<T extends string>({
  label,
  items,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  description,
  error,
  disabled,
  hideLabel = false,
  className,
}: SelectProps<T>) {
  return (
    <div className={cn("flex w-full flex-col gap-1", className)}>
      <BaseSelect.Root
        items={items as SelectItem<T>[]}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next as T)}
        disabled={disabled}
      >
        <BaseSelect.Label
          className={cn("type-label text-ink", hideLabel && "sr-only-text")}
        >
          {label}
        </BaseSelect.Label>

        <BaseSelect.Trigger
          aria-invalid={error ? true : undefined}
          className={cn(
            "type-body flex h-10 w-full select-none items-center justify-between gap-2",
            "border border-line-strong bg-canvas px-2 text-left text-ink",
            "transition-colors duration-(--dur-fast) ease-(--ease-out)",
            "hover:bg-surface",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong",
            "data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-surface-sunken data-disabled:text-ink-disabled",
            error && "border-critical",
          )}
        >
          <BaseSelect.Value placeholder={placeholder} />
          <BaseSelect.Icon className="shrink-0 text-ink-muted">
            <ChevronsUpDown className="lucide size-4" aria-hidden="true" />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={4} className="z-50 outline-none">
            <BaseSelect.Popup
              className={cn(
                "max-h-72 min-w-(--anchor-width) overflow-y-auto",
                // An overlay is separated from the page by a strong border,
                // because there is no shadow available to lift it.
                "border border-line-strong bg-canvas py-1",
              )}
            >
              <BaseSelect.List>
                {items.map((item) => (
                  <BaseSelect.Item
                    key={item.value}
                    value={item.value}
                    className={cn(
                      "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 px-2 py-2",
                      "data-highlighted:bg-surface",
                      "data-disabled:text-ink-disabled",
                    )}
                  >
                    <BaseSelect.ItemIndicator className="col-start-1 text-ink">
                      <Check className="lucide size-4" aria-hidden="true" />
                    </BaseSelect.ItemIndicator>
                    <span className="col-start-2 min-w-0">
                      <BaseSelect.ItemText className="type-body block truncate text-ink">
                        {item.label}
                      </BaseSelect.ItemText>
                      {item.detail ? (
                        <span className="type-label block truncate text-ink-muted">
                          {item.detail}
                        </span>
                      ) : null}
                    </span>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>

      {description && !error ? (
        <p className="type-label text-ink-muted">{description}</p>
      ) : null}
      {error ? <p className="type-label text-critical">{error}</p> : null}
    </div>
  );
}
