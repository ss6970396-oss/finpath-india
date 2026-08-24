/**
 * Stable identity colours for the spending categories.
 *
 * A category is a NOMINAL variable: Needs is Needs whether the month went
 * well or badly. Colour it by status and you get a category that turns red in
 * October and green in November, which tells the reader nothing about what the
 * row is and lies about what it means.
 *
 * So: identity lives here and never changes. Status (on target / over / below)
 * is carried separately by the badge, the arrow glyph and the variance text —
 * see `statusTone` in the spending page.
 *
 * Needs deliberately takes the blue rather than a warm colour. Rent and
 * electricity are not a failure, and an amber Needs bucket reads as a scolding.
 *
 * Tailwind needs literal class strings at build time, so these are written out
 * rather than composed — `text-data-${n}` would not survive the compiler.
 */

export type CategoryKey =
  | "Needs"
  | "Wants"
  | "Savings"
  | "Uncategorised"
  | "Income";

export type CategoryStyle = {
  /** Text, for the category label itself. */
  text: string;
  /** Fill, for meter bars and the table's left accent rule. */
  bg: string;
  /** Border, for the badge outline. */
  border: string;
  /** The raw CSS variable, for SVG stroke/fill props in charts. */
  cssVar: string;
};

export const CATEGORY: Record<CategoryKey, CategoryStyle> = {
  Savings: {
    text: "text-data-1",
    bg: "bg-data-1",
    border: "border-data-1",
    cssVar: "var(--color-data-1)",
  },
  Needs: {
    text: "text-data-2",
    bg: "bg-data-2",
    border: "border-data-2",
    cssVar: "var(--color-data-2)",
  },
  Wants: {
    text: "text-data-3",
    bg: "bg-data-3",
    border: "border-data-3",
    cssVar: "var(--color-data-3)",
  },
  // Not a category the student chose — it is the absence of one. It stays
  // neutral so it never competes with a real bucket for attention.
  Uncategorised: {
    text: "text-ink-faint",
    bg: "bg-ink-faint",
    border: "border-rule-strong",
    cssVar: "var(--color-ink-faint)",
  },
  Income: {
    text: "text-data-6",
    bg: "bg-data-6",
    border: "border-data-6",
    cssVar: "var(--color-data-6)",
  },
};

/** Micro-leakage is a TAG applied to a row, not a bucket the row belongs to. */
export const LEAKAGE: CategoryStyle = {
  text: "text-data-4",
  bg: "bg-data-4",
  border: "border-data-4",
  cssVar: "var(--color-data-4)",
};

export function categoryStyle(key: string): CategoryStyle {
  return CATEGORY[key as CategoryKey] ?? CATEGORY.Uncategorised;
}
