/** Display formatting. Every figure rendered through these is monospace
 *  tabular at the component level via the `figure` class. */

export const inr = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

/** Compact Indian units — 1,20,000 -> 1.2L, 15,00,000 -> 15.0L, 2Cr+ -> Cr */
export function inrCompact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return "₹" + (n / 1_00_00_000).toFixed(2) + "Cr";
  if (a >= 1_00_000) return "₹" + (n / 1_00_000).toFixed(1) + "L";
  if (a >= 1_000) return "₹" + (n / 1_000).toFixed(0) + "k";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export const pct = (fraction: number, digits = 0) =>
  (fraction * 100).toFixed(digits) + "%";

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
