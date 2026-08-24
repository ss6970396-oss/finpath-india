/** Display formatting. Every figure rendered through these is monospace
 *  tabular at the component level via the `tnum` class.
 *
 *  The rupee formatters live in lib/money.ts — the single implementation the
 *  <Money> component also uses. These are the shorthand call sites keep. */

import { formatINR, formatINRCompact, formatPct } from "./money";

export const inr = (n: number) => formatINR(n);

/** Compact Indian units. Chart axis ticks only — see lib/money.ts. */
export const inrCompact = (n: number) => formatINRCompact(n);

export const pct = (fraction: number, digits = 0) => formatPct(fraction, digits);

export function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/** "FE_Handbook_Eng.pdf" -> "FE Handbook Eng" */
export function prettySource(file: string): string {
  return file
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
