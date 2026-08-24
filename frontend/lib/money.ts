/**
 * The money layer. Section 10: arithmetic never touches a JS float — amounts
 * move around the app as integer paise and are formatted only at the render
 * boundary, which is the <Money> component.
 *
 * Rupee display is always en-IN digit grouping: 1,08,240 — never 108,240 and
 * never a rounded-off "1.08L" (Section 8 forbids rounding lies in a figure).
 */

export const PAISE = 100;

/** Rupees (possibly fractional, e.g. from an API) -> integer paise. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * PAISE);
}

/** Integer paise -> rupees, for display only. */
export function toRupees(paise: number): number {
  return paise / PAISE;
}

const INR_WHOLE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INR_PAISE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * The canonical rupee string. Whole rupees by default, because every amount
 * in this product is a whole-rupee UPI figure; pass showPaise for the rare
 * screen that needs the decimals.
 */
export function formatINR(rupees: number, showPaise = false): string {
  const safe = Number.isFinite(rupees) ? rupees : 0;
  return (showPaise ? INR_PAISE : INR_WHOLE).format(safe);
}

/** Percentages, tabular, one place by default. */
export function formatPct(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function underThousand(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds) parts.push(`${ONES[hundreds]} hundred`);
  if (rest) {
    if (rest < 20) parts.push(ONES[rest]);
    else {
      const tens = TENS[Math.floor(rest / 10)];
      const ones = rest % 10;
      parts.push(ones ? `${tens} ${ONES[ones]}` : tens);
    }
  }
  return parts.join(" ");
}

/**
 * Section 10: every amount carries an accessible label, because a screen
 * reader announcing "four two eight zero" from a tabular figure is useless.
 * Indian grouping, so 12,34,567 reads "twelve lakh thirty four thousand...".
 */
export function inrToWords(rupees: number): string {
  const whole = Math.abs(Math.round(rupees));
  if (whole === 0) return "zero rupees";

  const crore = Math.floor(whole / 1_00_00_000);
  const lakh = Math.floor((whole % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((whole % 1_00_000) / 1_000);
  const rest = whole % 1_000;

  const parts: string[] = [];
  if (crore) parts.push(`${underThousand(crore)} crore`);
  if (lakh) parts.push(`${underThousand(lakh)} lakh`);
  if (thousand) parts.push(`${underThousand(thousand)} thousand`);
  if (rest) parts.push(underThousand(rest));

  const sign = rupees < 0 ? "minus " : "";
  return `${sign}${parts.join(" ")} rupees`;
}

/**
 * Compact Indian units. Chart axis ticks ONLY — a tick reading ₹1,08,240
 * collides with its neighbour. Never use this for an amount the student is
 * meant to act on; that is what formatINR is for.
 */
export function formatINRCompact(rupees: number): string {
  const abs = Math.abs(rupees);
  if (abs >= 1_00_00_000) return `₹${(rupees / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(rupees / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `₹${Math.round(rupees / 1_000)}k`;
  return formatINR(rupees);
}
