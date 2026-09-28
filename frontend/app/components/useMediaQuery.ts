"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query. Server render and the hydration pass
 * report `false`, so a layout keyed on this renders its narrow form first
 * and switches once mounted — never a hydration mismatch.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The margin gutter's breakpoint (--width-gutter opens at 80rem / 1280px). */
export const WIDE = "(min-width: 80rem)";
