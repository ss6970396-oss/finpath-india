/**
 * Display formatting (§14). The only place a number becomes a string.
 *
 * Every financial figure in the product goes through one of these five
 * functions. No component may call `toFixed`, build a rupee string by hand,
 * or reach for `Intl` directly — `npm run design-lint` fails on all three.
 *
 * The amount functions take PAISE (see lib/money.ts). That is what makes
 * "no floating-point currency arithmetic" true rather than aspirational:
 * a rupee float cannot reach a formatter without passing through an
 * explicit conversion first.
 */

import {
  PAISE_PER_RUPEE,
  type Paise,
  rupeesToPaise,
  toEngineRupees,
} from "./money";

/* ---------------------------------------------------------------- money */

const INR_WHOLE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INR_EXACT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * The canonical rupee string: `₹1,50,000`.
 *
 * en-IN digit grouping, always — `₹1,50,000`, never `₹150,000`. The Indian
 * reader parses lakhs by the position of the comma, and Western grouping
 * makes a familiar number unreadable at a glance.
 *
 * Whole rupees by default. `withPaise` is for the two screens that
 * genuinely reconcile to the paisa (an imported statement line, an export).
 */
export function formatINR(amount: Paise, withPaise = false): string {
  const value = toEngineRupees(amount);
  return (withPaise ? INR_EXACT : INR_WHOLE).format(value);
}

const LAKH = 1_00_000 * PAISE_PER_RUPEE;
const CRORE = 1_00_00_000 * PAISE_PER_RUPEE;

/**
 * Compact Indian units: `₹1.5L`, `₹1.2Cr`.
 *
 * Indian units only. `₹150K` and `₹1.5M` are forbidden by §14 and there is
 * no thousands abbreviation at all — below a lakh the full figure is short
 * enough to read, so `₹75,000` stays `₹75,000`.
 *
 * CHART AXIS TICKS AND DENSE TABLE CELLS ONLY. A rounded figure is a lie
 * about precision: never use this for an amount the student is meant to
 * act on, reconcile, or type back in.
 */
export function formatCompactINR(amount: Paise): string {
  const abs = Math.abs(amount);
  if (abs >= CRORE) return `₹${trimZero(amount / CRORE, 2)}Cr`;
  if (abs >= LAKH) return `₹${trimZero(amount / LAKH, 1)}L`;
  return formatINR(amount);
}

/** `1.50` -> `1.5`, `2.00` -> `2`. Keeps a compact figure compact. */
function trimZero(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

/* ----------------------------------------------------------- percentages */

export type PercentOptions = {
  /** Decimal places. One by default — `4.2%`, not `4%` and not `4.20%`. */
  digits?: number;
  /**
   * Show a leading `+` on positive values. For a CHANGE or a variance,
   * where the direction is the point: `+4.2%`. Off for a share of a whole
   * (`30% of your allowance`), where a `+` would be noise.
   */
  signed?: boolean;
};

/**
 * A fraction as a percentage: `formatPercent(0.042, { signed: true })`
 * gives `+4.2%`.
 *
 * Takes a FRACTION (0.042), not a percentage (4.2). Every ratio in the
 * financial engines is a fraction, so this is the unit that arrives, and
 * accepting both would guarantee a 100x bug eventually.
 */
export function formatPercent(
  fraction: number,
  { digits = 1, signed = false }: PercentOptions = {},
): string {
  if (!Number.isFinite(fraction)) return "—";
  const pct = fraction * 100;
  const sign = signed && pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(digits)}%`;
}

/* ----------------------------------------------------------------- dates */

const DATE_FULL = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_MONTH = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Parse `yyyy-mm-dd` into a UTC instant.
 *
 * Pinned to UTC on both ends — parse and format. `new Date("2026-08-04")`
 * is midnight UTC, and formatting that in any timezone west of Greenwich
 * renders "03 Aug 2026". A transaction dated the 4th must not display as
 * the 3rd because of where the reader is sitting.
 */
function utcFromIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `2026-08-04` -> `04 Aug 2026`. Returns the input unchanged if unparseable. */
export function formatDate(iso: string): string {
  const d = utcFromIso(iso);
  return d ? DATE_FULL.format(d) : iso;
}

/** `2026-08-04` or `2026-08` -> `Aug 2026`. */
export function formatMonth(iso: string): string {
  const d = utcFromIso(/^\d{4}-\d{2}$/.test(iso) ? `${iso}-01` : iso);
  return d ? DATE_MONTH.format(d) : iso;
}

/* ----------------------------------------------------------------- counts */

/** A plain count with en-IN grouping: `1,204 chunks indexed`. */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN").format(Math.round(value));
}

/* ---------------------------------------------------------------- source */

/** `FE_Handbook_Eng.pdf` -> `FE Handbook Eng`. */
export function prettySource(file: string): string {
  return file
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   DEPRECATED — rupee-taking shims. DELETE IN PHASE 3.

   The not-yet-rebuilt pages pass float rupees. These keep them compiling
   and rendering correctly until each page is rebuilt onto the paise API
   above. They are counted as legacy debt by `npm run design-lint`.

   Do not call these from new code.
   ============================================================ */

/** @deprecated Pass paise to `formatINR`. */
export const inr = (rupeeValue: number) => formatINR(rupeesToPaise(rupeeValue));

/** @deprecated Pass paise to `formatCompactINR`. */
export const inrCompact = (rupeeValue: number) =>
  formatCompactINR(rupeesToPaise(rupeeValue));

/** @deprecated Use `formatPercent`. Note the different digit default. */
export const pct = (fraction: number, digits = 0) =>
  formatPercent(fraction, { digits });

/** @deprecated Use `formatDate`, which includes the year. */
export function shortDate(iso: string): string {
  const d = utcFromIso(iso);
  if (!d) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(d);
}
