/**
 * Financial calculation utilities.
 *
 * The SIP primitives live in ./sip.ts and mirror backend/nudge.py to the
 * rupee. Everything here is derived analysis that the backend does not
 * compute — it is defined once, in this file, so the Spending Engine, the
 * Simulator and the Roadmap cannot drift from one another.
 *
 * Every function is pure and total: no NaN, no Infinity, no division by a
 * zero the caller has to guard.
 */

import { sipFutureValue } from "./sip";

/* ---------------------------------------------------------------- 50/30/20 */

export const RULE = { needs: 0.5, wants: 0.3, savings: 0.2 } as const;
export type Bucket = "Needs" | "Wants" | "Savings";

export type BucketRatios = Record<Bucket, number>;

/**
 * Shares of ALLOWANCE (income), which is what the 50/30/20 rule means and
 * what backend/nudge.py compares against when it fires the alert. Note the
 * API's own `wants_pct` field uses a different denominator (share of spend)
 * and must not be substituted here.
 */
export function ratios(
  totals: Record<string, number>,
  allowance: number,
): BucketRatios {
  const safe = allowance > 0 ? allowance : 1;
  return {
    Needs: (totals.Needs ?? 0) / safe,
    Wants: (totals.Wants ?? 0) / safe,
    Savings: (totals.Savings ?? 0) / safe,
  };
}

/** Signed deviation from target. Positive means above the 50/30/20 line. */
export function variance(r: BucketRatios): BucketRatios {
  return {
    Needs: r.Needs - RULE.needs,
    Wants: r.Wants - RULE.wants,
    Savings: r.Savings - RULE.savings,
  };
}

/* ----------------------------------------------------------- health score */

export type HealthBand = "Strong" | "Stable" | "Strained" | "At risk";

export type Health = {
  score: number; // 0-100
  band: HealthBand;
  parts: { savings: number; wants: number; needs: number; buffer: number };
};

/**
 * Financial health, 0-100. Deliberately weighted toward the two things a
 * student can actually act on this month.
 *
 *   Savings rate   40 pts — full marks at or above the 20% target
 *   Wants control  30 pts — full marks at or below the 30% ceiling
 *   Needs control  15 pts — full marks at or below the 50% ceiling
 *   Unspent buffer 15 pts — full marks with 10% of allowance left over
 *
 * Overshoot is scored linearly to zero at twice the target, so the score
 * degrades smoothly instead of cliff-edging.
 */
export function healthScore(
  totals: Record<string, number>,
  allowance: number,
): Health {
  const r = ratios(totals, allowance);
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

  // floor: more is better
  const savings = clamp01(r.Savings / RULE.savings) * 40;
  // ceilings: less is better, zero once you hit 2x the target
  const wants = clamp01(2 - r.Wants / RULE.wants) * 30;
  const needs = clamp01(2 - r.Needs / RULE.needs) * 15;

  const spent = (totals.Needs ?? 0) + (totals.Wants ?? 0) + (totals.Savings ?? 0);
  const leftover = (allowance - spent) / (allowance > 0 ? allowance : 1);
  const buffer = clamp01(leftover / 0.1) * 15;

  const score = Math.round(savings + wants + needs + buffer);
  const band: HealthBand =
    score >= 80
      ? "Strong"
      : score >= 60
        ? "Stable"
        : score >= 40
          ? "Strained"
          : "At risk";

  return {
    score: Math.max(0, Math.min(100, score)),
    band,
    parts: {
      savings: Math.round(savings),
      wants: Math.round(wants),
      needs: Math.round(needs),
      buffer: Math.round(buffer),
    },
  };
}

/* ------------------------------------------------- guilt-free spending */

export type GuiltFree = {
  fixed: number;
  investmentTarget: number;
  safeToSpend: number;
  alreadySpentOnWants: number;
  remaining: number;
  perDay: number;
};

/**
 * What is genuinely free to burn once needs and the savings target are met.
 * `daysLeft` defaults to the remainder of a 30-day cycle.
 */
export function guiltFree(
  totals: Record<string, number>,
  allowance: number,
  daysLeft = 30,
): GuiltFree {
  const fixed = totals.Needs ?? 0;
  const investmentTarget = allowance * RULE.savings;
  const safeToSpend = Math.max(0, allowance - fixed - investmentTarget);
  const alreadySpentOnWants = totals.Wants ?? 0;
  const remaining = Math.max(0, safeToSpend - alreadySpentOnWants);
  const days = Math.max(1, daysLeft);
  return {
    fixed,
    investmentTarget,
    safeToSpend,
    alreadySpentOnWants,
    remaining,
    perDay: remaining / days,
  };
}

/* ------------------------------------------------------- opportunity cost */

/** What a one-off amount becomes if invested instead, as a lump sum. */
export function lumpSumFutureValue(
  amount: number,
  years: number,
  annualRate: number,
): number {
  if (amount <= 0 || years <= 0) return Math.max(0, Math.round(amount));
  return Math.round(amount * (1 + annualRate) ** years);
}

/** How many times the original amount that future value represents. */
export function multiple(amount: number, future: number): number {
  if (amount <= 0) return 0;
  return future / amount;
}

/* ------------------------------------------------------------- step-up SIP */

export type Series = { year: number; value: number }[];

/**
 * SIP where the monthly contribution rises by `stepUp` each anniversary.
 * Computed year by year: the previous balance compounds for twelve months
 * while that year's (larger) contribution is paid in as an annuity-due.
 */
export function stepUpSeries(
  monthly: number,
  years: number,
  annualRate: number,
  stepUp: number,
): Series {
  const r = annualRate / 12;
  const out: Series = [{ year: 0, value: 0 }];
  let balance = 0;
  let contribution = monthly;

  for (let y = 1; y <= years; y++) {
    const grown = balance * (1 + r) ** 12;
    const added =
      r === 0
        ? contribution * 12
        : contribution * (((1 + r) ** 12 - 1) / r) * (1 + r);
    balance = grown + added;
    out.push({ year: y, value: Math.round(balance) });
    contribution *= 1 + stepUp;
  }
  return out;
}

/** Flat SIP, reusing the shared annuity-due helper so the two agree. */
export function flatSeries(
  monthly: number,
  years: number,
  annualRate: number,
): Series {
  return Array.from({ length: years + 1 }, (_, y) => ({
    year: y,
    value: sipFutureValue(monthly, y, annualRate),
  }));
}

/**
 * Starting `delayYears` late: nothing accumulates during the delay, then a
 * flat SIP runs for the remaining time. Plotted on the same axis so the
 * permanent gap is visible rather than described.
 */
export function delayedSeries(
  monthly: number,
  years: number,
  annualRate: number,
  delayYears: number,
): Series {
  return Array.from({ length: years + 1 }, (_, y) => ({
    year: y,
    value:
      y <= delayYears
        ? 0
        : sipFutureValue(monthly, y - delayYears, annualRate),
  }));
}

/* ------------------------------------------------------- lifestyle creep */

export type CreepResult = {
  monthlyIncome: number;
  monthlyInvested: number;
  monthlyOverhead: number;
  annualOverhead: number;
  corpusTarget: number;
  yearsToFI: number | null;
  fiAge: number | null;
};

/**
 * Financial-independence projection under lifestyle creep.
 *
 * `investShare` is the fraction of income routed to investing; the rest
 * becomes overhead, and overhead sets the corpus you need (the 4% safe
 * withdrawal rule -> 25x annual spend). Returns null years when the
 * savings rate is too low to ever reach the target.
 */
export function lifestyleCreep(
  annualIncome: number,
  investShare: number,
  annualRate: number,
  currentAge: number,
  withdrawalRate = 0.04,
): CreepResult {
  const monthlyIncome = annualIncome / 12;
  const monthlyInvested = monthlyIncome * investShare;
  const monthlyOverhead = monthlyIncome - monthlyInvested;
  const annualOverhead = monthlyOverhead * 12;
  const corpusTarget = annualOverhead / withdrawalRate;

  if (monthlyInvested <= 0) {
    return {
      monthlyIncome,
      monthlyInvested,
      monthlyOverhead,
      annualOverhead,
      corpusTarget,
      yearsToFI: null,
      fiAge: null,
    };
  }

  // Search year by year rather than inverting the annuity — keeps it exact
  // against sipFutureValue and avoids log-domain edge cases.
  for (let y = 1; y <= 60; y++) {
    if (sipFutureValue(monthlyInvested, y, annualRate) >= corpusTarget) {
      return {
        monthlyIncome,
        monthlyInvested,
        monthlyOverhead,
        annualOverhead,
        corpusTarget,
        yearsToFI: y,
        fiAge: currentAge + y,
      };
    }
  }
  return {
    monthlyIncome,
    monthlyInvested,
    monthlyOverhead,
    annualOverhead,
    corpusTarget,
    yearsToFI: null,
    fiAge: null,
  };
}

/* ------------------------------------------------------------ stress test */

export type Shock = {
  id: string;
  label: string;
  detail: string;
  /** one-off cash hit */
  oneOff: number;
  /** months of income withheld */
  incomeMonthsLost: number;
};

export type Runway = {
  liquid: number;
  monthlyFixed: number;
  survivedDays: number;
  shortfall: number;
  covered: boolean;
};

/**
 * Days of fixed costs the liquid buffer covers after a shock.
 * `liquid` is the emergency pot; `monthlyFixed` is unavoidable outgo.
 */
export function runway(
  liquid: number,
  monthlyFixed: number,
  monthlyIncome: number,
  shock?: Shock,
): Runway {
  const hit = shock ? shock.oneOff + monthlyIncome * shock.incomeMonthsLost : 0;
  const remaining = liquid - hit;
  const perDay = monthlyFixed > 0 ? monthlyFixed / 30 : 0;

  if (perDay === 0) {
    return {
      liquid: remaining,
      monthlyFixed,
      survivedDays: remaining >= 0 ? 999 : 0,
      shortfall: Math.max(0, -remaining),
      covered: remaining >= 0,
    };
  }
  return {
    liquid: remaining,
    monthlyFixed,
    survivedDays: Math.max(0, Math.floor(remaining / perDay)),
    shortfall: Math.max(0, -remaining),
    covered: remaining >= 0,
  };
}

export const SHOCKS: Shock[] = [
  {
    id: "stipend",
    label: "Stipend / salary delayed 2 months",
    detail: "Two months of income withheld, fixed costs continue.",
    oneOff: 0,
    incomeMonthsLost: 2,
  },
  {
    id: "medical",
    label: "Emergency medical deductible",
    detail: "A one-off hospital deductible not covered by insurance.",
    oneOff: 25000,
    incomeMonthsLost: 0,
  },
  {
    id: "hardware",
    label: "Essential tech hardware failure",
    detail: "Laptop replacement required to continue coursework.",
    oneOff: 55000,
    incomeMonthsLost: 0,
  },
];

/* -------------------------------------------------- micro-habit matrix */

export type Habit = {
  id: string;
  label: string;
  unit: string;
  perOccurrence: number;
  perMonth: number;
};

export const HABITS: Habit[] = [
  { id: "delivery", label: "Food delivery order", unit: "per order", perOccurrence: 320, perMonth: 12 },
  { id: "barista", label: "Barista coffee", unit: "per cup", perOccurrence: 220, perMonth: 20 },
  { id: "cab", label: "Cab instead of metro", unit: "per ride", perOccurrence: 180, perMonth: 16 },
  { id: "quickcom", label: "Quick-commerce snacks", unit: "per basket", perOccurrence: 150, perMonth: 14 },
  { id: "subs", label: "Unused subscription", unit: "per month", perOccurrence: 199, perMonth: 1 },
];

/* ------------------------------------------------- real-asset equivalence */

/**
 * Reference prices for the landing page's equivalence readout.
 *
 * THESE ARE STATIC REFERENCE VALUES, NOT LIVE MARKET DATA. The app makes no
 * market data call; they exist to give an abstract rupee figure a physical
 * anchor and are labelled as indicative wherever they are rendered.
 */
export const REFERENCE = {
  goldPerGram: 7400,
  niftyIndexUnit: 24500,
  domesticFlight: 5500,
  monthHostelMess: 3000,
} as const;

export function equivalents(amount: number) {
  return [
    {
      id: "gold",
      label: "Sovereign gold",
      value: amount / REFERENCE.goldPerGram,
      unit: "grams",
      digits: 2,
    },
    {
      id: "index",
      label: "Benchmark index units",
      value: amount / REFERENCE.niftyIndexUnit,
      unit: "units",
      digits: 3,
    },
    {
      id: "flight",
      label: "Domestic flights",
      value: amount / REFERENCE.domesticFlight,
      unit: "tickets",
      digits: 1,
    },
    {
      id: "mess",
      label: "Hostel mess months",
      value: amount / REFERENCE.monthHostelMess,
      unit: "months",
      digits: 1,
    },
  ];
}
