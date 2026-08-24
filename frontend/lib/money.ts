/**
 * The money layer (§14).
 *
 * ONE RULE: money is stored, transported and added up as INTEGER PAISE.
 * It becomes a rupee number in exactly two places — the render boundary
 * (`lib/format.ts`, and through it the <Money> component) and the call
 * boundary into the frozen financial engines (`toEngineRupees`).
 *
 * Why paise. `0.1 + 0.2 !== 0.3`, and a ledger that totals 47 transactions
 * in float rupees is off by a few paise by the end of the month. The error
 * is invisible until a student's "money in minus money out" fails to equal
 * their balance, at which point the product has lied to them about the one
 * thing it exists to get right. Integers do not have that failure mode.
 *
 * The `Paise` brand is not decoration either: a plain `number` parameter
 * accepts a rupee figure silently and the bug renders as a 100x error. The
 * brand makes that a type error instead.
 *
 * KNOWN GAP, deliberate: the financial engines in lib/finance.ts, lib/sip.ts
 * and backend/nudge.py take float rupees and are frozen by the golden tests,
 * so they cannot be converted. `toEngineRupees` is the single documented
 * crossing point. Everything on this side of it is exact; the engines
 * themselves round their own results, as they always did. See docs/audit.md
 * finding F-08.
 */

/** Integer paise. Never construct one by hand — use the converters below. */
export type Paise = number & { readonly __brand: "paise" };

export const PAISE_PER_RUPEE = 100;

/* --------------------------------------------------------- construction */

/**
 * Rupees -> paise. The only way into the money layer from the outside
 * world (an API payload, a parsed statement, a form field).
 */
export function rupeesToPaise(rupees: number): Paise {
  if (!Number.isFinite(rupees)) return 0 as Paise;
  return Math.round(rupees * PAISE_PER_RUPEE) as Paise;
}

/** A whole-rupee literal, for constants and test fixtures. */
export function rupees(whole: number): Paise {
  return Math.round(whole) * PAISE_PER_RUPEE as Paise;
}

/** Assert an already-integer paise value, e.g. straight from the database. */
export function paise(value: number): Paise {
  if (!Number.isFinite(value)) return 0 as Paise;
  return Math.round(value) as Paise;
}

/* ------------------------------------------------------------ arithmetic */

/** Sum. Exact, because both sides are integers. */
export function addPaise(...values: Paise[]): Paise {
  let total = 0;
  for (const v of values) total += v;
  return total as Paise;
}

export function subPaise(a: Paise, b: Paise): Paise {
  return (a - b) as Paise;
}

/** Sum a list. Returns 0 paise for an empty list, never NaN. */
export function sumPaise(values: readonly Paise[]): Paise {
  let total = 0;
  for (const v of values) total += v;
  return total as Paise;
}

/**
 * A fraction of an amount — 30% of an allowance, a 12% annual rate.
 * Rounds to the nearest paisa, so repeated application cannot drift below
 * the unit of currency.
 */
export function shareOfPaise(amount: Paise, fraction: number): Paise {
  if (!Number.isFinite(fraction)) return 0 as Paise;
  return Math.round(amount * fraction) as Paise;
}

/** Ratio of two amounts as a plain fraction, e.g. 0.42. Zero-safe. */
export function ratioOfPaise(part: Paise, whole: Paise): number {
  if (whole === 0) return 0;
  return part / whole;
}

/** Never below zero — for "remaining", "shortfall" and similar. */
export function clampAtZero(value: Paise): Paise {
  return (value < 0 ? 0 : value) as Paise;
}

/* -------------------------------------------------------------- boundary */

/**
 * THE ENGINE BOUNDARY.
 *
 * lib/finance.ts, lib/sip.ts and the backend all take float rupees and are
 * frozen by the golden tests — converting them would change frozen output.
 * Every call into them goes through here, so the crossing is greppable and
 * the float arithmetic is confined to code that is under golden test.
 */
export function toEngineRupees(value: Paise): number {
  return value / PAISE_PER_RUPEE;
}

/** The return trip: an engine result (float rupees) back into the money layer. */
export function fromEngineRupees(value: number): Paise {
  return rupeesToPaise(value);
}

/* ------------------------------------------------------- accessible text */

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];

const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
  "eighty", "ninety",
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
 * §39: every amount carries an accessible label.
 *
 * A screen reader announcing a tabular figure reads "four two eight zero",
 * which is useless. Indian grouping, so 12,34,567 becomes "twelve lakh
 * thirty four thousand five hundred sixty seven rupees".
 */
export function inrToWords(amount: Paise): string {
  const whole = Math.abs(Math.round(amount / PAISE_PER_RUPEE));
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

  const sign = amount < 0 ? "minus " : "";
  return `${sign}${parts.join(" ")} rupees`;
}
