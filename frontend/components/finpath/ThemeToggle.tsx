"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyTheme,
  getServerTheme,
  readTheme,
  subscribeTheme,
  type Theme,
} from "@/lib/theme";

const OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const satisfies ReadonlyArray<{
  value: Theme;
  label: string;
  icon: typeof Sun;
}>;

/**
 * The Appearance control from Section 6.7, also the review surface for the
 * style guide. Rendered as a segmented control on one hairline border rather
 * than three buttons, so the choice reads as one setting.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // The setting lives in localStorage, which is an external store — reading it
  // through useSyncExternalStore keeps the server render ("system") and the
  // hydrated render in agreement without an effect that copies it into state.
  const theme = useSyncExternalStore(subscribeTheme, readTheme, getServerTheme);

  // "System" has to keep tracking the OS while the page is open.
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function choose(next: Theme) {
    applyTheme(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className={cn(
        "inline-flex items-center rounded-md border border-rule bg-paper p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => choose(value)}
            className={cn(
              "label-ui flex items-center gap-1.5 rounded-sm px-2.5 py-1.5",
              "transition-colors duration-[var(--dur-fast)]",
              selected
                ? "bg-accent-weak text-accent"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
