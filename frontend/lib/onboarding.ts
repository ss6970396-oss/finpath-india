/**
 * The financial profile the student declares during onboarding, and the
 * single function that turns it into the input the frozen engines take.
 *
 * WHY THIS FILE EXISTS
 *
 * `lib/finance.ts` scores a month from two things: a bucket total map and
 * an allowance. It does not care whether those came from a simulated feed,
 * a parsed bank statement, or a person typing numbers into a form. So
 * onboarding does not get its own scoring path — it produces exactly the
 * shape the engines already eat, and every downstream figure (health
 * score, ratios, guilt-free envelope, projections) is computed by the same
 * code that scores the other two sources.
 *
 * That is what keeps the onboarding real rather than decorative: nothing
 * here invents a number, and nothing downstream knows where the numbers
 * came from.
 */

import { RULE, type Bucket } from "./finance";

/* ------------------------------------------------------------------ model */

export type EssentialKey =
  | "rent"
  | "utilities"
  | "food"
  | "transport"
  | "other";

export type LifestyleKey =
  | "shopping"
  | "dining"
  | "entertainment"
  | "subscriptions"
  | "travel";

export type DebtKey = "creditCard" | "loans" | "bnpl" | "other";

export type GoalId =
  | "emergency"
  | "investing"
  | "home"
  | "education"
  | "travel"
  | "retirement";

/** What the student wants the plan to optimise for. Orders the plan, nothing else. */
export type Priority = "safety" | "balance" | "growth";

export type FinancialProfile = {
  version: 1;
  /**
   * Used only to project the age at which invested money could cover
   * living costs. Nothing else reads it, and it is never displayed as an
   * identity attribute.
   */
  age: number;
  /** Take-home, per month, in rupees. The denominator for every ratio. */
  monthlyIncome: number;
  essentials: Record<EssentialKey, number>;
  lifestyle: Record<LifestyleKey, number>;
  /** Amount actually moved to savings or investments each month. */
  monthlySavings: number;
  /** Liquid emergency balance held today. A stock, not a flow. */
  emergencyFund: number;
  /** Outstanding balances. Stocks, not monthly instalments. */
  debts: Record<DebtKey, number>;
  goals: GoalId[];
  priority: Priority;
  /** ISO instant. Null until the last step is submitted. */
  completedAt: string | null;
};

export const ESSENTIALS: { key: EssentialKey; label: string; hint: string }[] = [
  { key: "rent", label: "Rent or hostel", hint: "Room, PG or hostel fee" },
  { key: "utilities", label: "Utilities", hint: "Electricity, water, internet, phone" },
  { key: "food", label: "Groceries and mess", hint: "Food you cannot skip" },
  { key: "transport", label: "Transport", hint: "Bus, metro, fuel, commute" },
  { key: "other", label: "Other essentials", hint: "Fees, medicines, insurance" },
];

export const LIFESTYLE: { key: LifestyleKey; label: string; hint: string }[] = [
  { key: "shopping", label: "Shopping", hint: "Clothes, gadgets, everything optional" },
  { key: "dining", label: "Eating out and delivery", hint: "Restaurants, cafés, apps" },
  { key: "entertainment", label: "Entertainment", hint: "Films, events, gaming" },
  { key: "subscriptions", label: "Subscriptions", hint: "Streaming, music, software" },
  { key: "travel", label: "Travel", hint: "Trips home, holidays" },
];

export const DEBTS: { key: DebtKey; label: string; hint: string }[] = [
  { key: "creditCard", label: "Credit card", hint: "Balance you carry past the due date" },
  { key: "loans", label: "Loans", hint: "Education, personal, vehicle" },
  { key: "bnpl", label: "Pay later", hint: "BNPL and instalment plans" },
  { key: "other", label: "Other", hint: "Money owed to family or friends" },
];

export const GOALS: { id: GoalId; label: string; hint: string }[] = [
  { id: "emergency", label: "Build an emergency fund", hint: "Cover three months of essentials" },
  { id: "investing", label: "Start investing monthly", hint: "Put money to work automatically" },
  { id: "home", label: "Save for a home", hint: "A deposit, years out" },
  { id: "education", label: "Fund further study", hint: "Course fees, exams, abroad" },
  { id: "travel", label: "Travel", hint: "A trip you are saving toward" },
  { id: "retirement", label: "Long-term wealth", hint: "Retirement, financial independence" },
];

export const PRIORITIES: { id: Priority; label: string; hint: string }[] = [
  {
    id: "safety",
    label: "Safety first",
    hint: "Clear debt and build a cash buffer before anything else.",
  },
  {
    id: "balance",
    label: "A balance of both",
    hint: "Build the buffer and start investing alongside it.",
  },
  {
    id: "growth",
    label: "Growth first",
    hint: "Push more into long-term investing, accept a thinner buffer.",
  },
];

/**
 * The starting age when none is given. It is a default, not an assumption
 * about the reader: the income step asks for the real one, and every
 * projection that uses it names the age it used.
 */
export const DEFAULT_AGE = 21;

/** A profile with nothing declared. Never treated as data — `completedAt` gates it. */
export const EMPTY_PROFILE: FinancialProfile = {
  version: 1,
  age: DEFAULT_AGE,
  monthlyIncome: 0,
  essentials: { rent: 0, utilities: 0, food: 0, transport: 0, other: 0 },
  lifestyle: {
    shopping: 0,
    dining: 0,
    entertainment: 0,
    subscriptions: 0,
    travel: 0,
  },
  monthlySavings: 0,
  emergencyFund: 0,
  debts: { creditCard: 0, loans: 0, bnpl: 0, other: 0 },
  goals: [],
  priority: "balance",
  completedAt: null,
};

export function isComplete(profile: FinancialProfile | null): boolean {
  return Boolean(profile?.completedAt) && (profile?.monthlyIncome ?? 0) > 0;
}

/* ----------------------------------------------------------------- steps */

export type StepId =
  | "welcome"
  | "income"
  | "essentials"
  | "lifestyle"
  | "savings"
  | "debt"
  | "goals"
  | "priorities";

export const STEPS: { id: StepId; title: string; purpose: string }[] = [
  {
    id: "welcome",
    title: "Let's find your starting point",
    purpose: "Eight short questions. Nothing is shared, and you can change any of it later.",
  },
  {
    id: "income",
    title: "What comes in each month?",
    purpose:
      "Your take-home amount after tax — allowance, stipend, salary, or all three.",
  },
  {
    id: "essentials",
    title: "What must you pay?",
    purpose: "The costs that arrive whether or not you think about them.",
  },
  {
    id: "lifestyle",
    title: "What do you choose to spend on?",
    purpose: "Estimates are fine. This is the part you have the most control over.",
  },
  {
    id: "savings",
    title: "What are you setting aside?",
    purpose: "What you save each month, and what you already hold for emergencies.",
  },
  {
    id: "debt",
    title: "What do you owe?",
    purpose: "Outstanding balances, not monthly instalments. Leave anything blank at zero.",
  },
  {
    id: "goals",
    title: "What are you working toward?",
    purpose: "Pick as many as apply. This orders your plan.",
  },
  {
    id: "priorities",
    title: "How should we weigh it up?",
    purpose: "There is no wrong answer. It decides what your plan puts first.",
  },
];

/* ------------------------------------------------------------- derivation */

export type DerivedBudget = {
  /** Monthly income. The denominator every ratio is measured against. */
  allowance: number;
  /** Exactly the shape `ratios()`, `healthScore()` and `guiltFree()` take. */
  totals: Record<Bucket | "Uncategorised", number>;
  essentialsTotal: number;
  lifestyleTotal: number;
  /** Income not accounted for by needs, wants or savings. May be negative. */
  unallocated: number;
  debtTotal: number;
  /** Three months of declared essentials — the buffer the plan works toward. */
  emergencyTarget: number;
  /** Months of essentials the current buffer covers. Null when essentials are zero. */
  emergencyMonths: number | null;
};

/**
 * Declared profile -> engine input.
 *
 * Two mappings carry all the meaning, and both are arguable, so they are
 * stated rather than buried:
 *
 *   essentials -> Needs      the costs that arrive anyway
 *   lifestyle  -> Wants      the costs that are a decision
 *
 * Debt does NOT become a bucket. The balances collected in onboarding are
 * stocks, and a stock cannot be added to a month of flows without either
 * inventing an instalment or double-counting one already declared under
 * essentials. It drives the plan instead, which is where it belongs.
 *
 * Nothing lands in Uncategorised: every rupee here was named by the person
 * who typed it. Money the three buckets do not account for stays visible as
 * `unallocated`, and the health score already reads it as unspent buffer.
 */
export function deriveBudget(profile: FinancialProfile): DerivedBudget {
  const sum = (values: Record<string, number>) =>
    Object.values(values).reduce((total, v) => total + (v > 0 ? v : 0), 0);

  const essentialsTotal = sum(profile.essentials);
  const lifestyleTotal = sum(profile.lifestyle);
  const savings = Math.max(0, profile.monthlySavings);
  const allowance = Math.max(0, profile.monthlyIncome);
  const debtTotal = sum(profile.debts);

  return {
    allowance,
    totals: {
      Needs: essentialsTotal,
      Wants: lifestyleTotal,
      Savings: savings,
      Uncategorised: 0,
    },
    essentialsTotal,
    lifestyleTotal,
    unallocated: allowance - essentialsTotal - lifestyleTotal - savings,
    debtTotal,
    emergencyTarget: essentialsTotal * 3,
    emergencyMonths:
      essentialsTotal > 0 ? profile.emergencyFund / essentialsTotal : null,
  };
}

/**
 * The savings figure the 50/30/20 rule asks for, given declared income.
 * Used by the plan and by the onboarding summary so both quote one number.
 */
export function savingsTarget(monthlyIncome: number): number {
  return Math.max(0, monthlyIncome) * RULE.savings;
}
