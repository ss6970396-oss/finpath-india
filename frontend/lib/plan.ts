/**
 * The financial plan: four ordered stages, each scored from the same
 * diagnosis the Spending page renders, and each carrying the concrete
 * actions that would close its gap.
 *
 * This module is the single source for the roadmap. `/plan` renders all of
 * it; `/home` renders the top of it as "your next best actions". They
 * cannot drift, because there is only one derivation.
 *
 * Nothing in here is a suggestion in general. Every action either has a
 * figure computed from the student's own numbers, or is explicitly marked
 * as self-attested — because the transaction feed carries no liability
 * data and no product may imply it has checked something it has not.
 */

import { RULE, type Bucket } from "./finance";
import type { Priority } from "./onboarding";

export type PlanStatus = "complete" | "attention" | "upcoming";

export type PlanAction = {
  id: string;
  stepId: StepKey;
  title: string;
  /** One sentence: why this, and why now. */
  why: string;
  /**
   * True when the current numbers say this gap is open. A false action is
   * still shown inside its stage, but never surfaced as a "next action".
   */
  flagged: boolean;
  /**
   * True when nothing in the data can confirm completion, so the student's
   * own tick is the only evidence. Always disclosed in the UI.
   */
  selfAttested?: boolean;
};

export type StepKey = "debt" | "buffer" | "invest" | "wealth";

export type PlanStep = {
  id: StepKey;
  n: number;
  title: string;
  /** What "done" means, in one line. */
  purpose: string;
  /** 0–1. */
  progress: number;
  status: PlanStatus;
  /** How the progress figure was arrived at, in words. Never omitted. */
  measure: string;
  /** Rupee target, where the stage has one. */
  target?: number;
  /** Rupee amount held or achieved so far, where the stage has one. */
  current?: number;
  actions: PlanAction[];
};

export type PlanInput = {
  allowance: number;
  totals: Record<string, number>;
  ratio: Record<Bucket, number>;
  /** Share of allowance above which Wants is over target. From the API. */
  wantsThreshold: number;
  /** Liquid emergency balance held. Null when it was never declared. */
  emergencyFund: number | null;
  /** Three months of essentials. */
  emergencyTarget: number;
  /** Total outstanding balances. Null when never declared. */
  debtTotal: number | null;
  priority: Priority;
  /** Task id -> ticked, from the persisted checklist. */
  done: Record<string, boolean>;
};

export type Plan = {
  steps: PlanStep[];
  actions: PlanAction[];
  /** Flagged, not yet ticked, in plan order. The first three are "next best". */
  open: PlanAction[];
  completedCount: number;
  totalCount: number;
  /** 0–1 across every action in the plan. */
  progress: number;
};

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);

export function buildPlan(input: PlanInput): Plan {
  const {
    allowance, totals, ratio, wantsThreshold,
    emergencyFund, emergencyTarget, debtTotal, priority, done,
  } = input;

  const savingsTarget = allowance * RULE.savings;
  const savingsProgress = clamp01(ratio.Savings / RULE.savings);
  const wantsExcess = Math.max(0, (totals.Wants ?? 0) - allowance * wantsThreshold);
  const wantsUnderControl = wantsExcess <= 0;

  // The buffer is measured against the declared balance when there is one.
  // Where onboarding never ran, cumulative Savings in the ledger is the only
  // available proxy — and the `measure` string says exactly that, so the
  // student is never shown a progress bar without being told what it read.
  const bufferHeld = emergencyFund ?? totals.Savings ?? 0;
  const bufferDeclared = emergencyFund !== null;
  const bufferProgress =
    emergencyTarget > 0 ? clamp01(bufferHeld / emergencyTarget) : 0;

  // Debt is self-attested unless onboarding declared a balance, in which
  // case zero is a real answer and a positive figure is a real gap.
  const debtDeclared = debtTotal !== null;
  const debtTicked = Boolean(done["debt-clear"]) && Boolean(done["debt-later"]);
  const debtProgress = debtDeclared
    ? debtTotal === 0
      ? 1
      : 0
    : debtTicked
      ? 1
      : Number(Boolean(done["debt-clear"])) * 0.5 +
        Number(Boolean(done["debt-later"])) * 0.5;

  const steps: Omit<PlanStep, "n" | "status">[] = [
    {
      id: "debt",
      title: "Clear what you owe at the highest rate",
      purpose: "No balance rolling over on a credit card or a pay-later plan.",
      progress: debtProgress,
      measure: debtDeclared
        ? debtTotal === 0
          ? "You told us you carry no outstanding balance."
          : "Measured against the balances you declared."
        : "Self-attested — nothing in your statement can confirm a cleared balance.",
      target: debtDeclared && debtTotal ? debtTotal : undefined,
      actions: [
        {
          id: "debt-clear",
          stepId: "debt",
          title: "Pay your card's full statement balance, not the minimum",
          why: "Paying the minimum leaves the rest accruing at the card's full rate, which is almost always the most expensive money you hold.",
          flagged: debtDeclared ? (debtTotal ?? 0) > 0 : true,
          selfAttested: !debtDeclared,
        },
        {
          id: "debt-later",
          stepId: "debt",
          title: "Close open pay-later instalments, shortest first",
          why: "Each one you retire removes a fixed monthly commitment, which makes every following month easier to plan.",
          flagged: debtDeclared ? (debtTotal ?? 0) > 0 : true,
          selfAttested: !debtDeclared,
        },
      ],
    },
    {
      id: "buffer",
      title: "Build three months of breathing room",
      purpose: "Enough cash to cover your essentials if income stops.",
      progress: bufferProgress,
      current: bufferHeld,
      target: emergencyTarget,
      measure: bufferDeclared
        ? "Measured against three months of the essentials you declared."
        : "Read from savings in your ledger, because no emergency balance was declared.",
      actions: [
        {
          id: "buffer-account",
          stepId: "buffer",
          title: "Keep it in a separate account with no card attached",
          why: "A buffer held in the account you spend from is a buffer that gets spent.",
          flagged: bufferProgress < 1,
          selfAttested: true,
        },
        {
          id: "buffer-fund",
          stepId: "buffer",
          title: "Top it up until it covers three months",
          why: "Three months is the point at which a delayed stipend or a lost job stops being an emergency and becomes an inconvenience.",
          flagged: bufferProgress < 1,
        },
      ],
    },
    {
      id: "invest",
      title: "Make investing automatic",
      purpose: "A fixed amount leaving on the day income lands, before anything else.",
      progress: savingsProgress,
      current: totals.Savings ?? 0,
      target: savingsTarget,
      measure: "Measured against a 20% savings rate on your monthly income.",
      actions: [
        {
          id: "invest-sip",
          stepId: "invest",
          title: "Set up a monthly instruction for your savings target",
          why: "Investing after spending is investing with whatever is left. Dating the instruction to the day after income arrives reverses that.",
          flagged: savingsProgress < 1,
        },
        {
          id: "invest-wants",
          stepId: "invest",
          title: "Bring discretionary spending back under target",
          why: wantsUnderControl
            ? "Already within the guideline. The work now is holding it there as income rises."
            : "This is the largest single lever you have this month, and it needs no extra income.",
          flagged: !wantsUnderControl,
        },
      ],
    },
    {
      id: "wealth",
      title: "Let it compound",
      purpose: "Contributions that rise with income, reviewed once a year.",
      // Only meaningful once the buffer exists and investing is running;
      // reporting progress before that would reward the wrong order.
      progress: bufferProgress >= 1 && savingsProgress >= 1 ? 0.5 : 0,
      measure: "Opens once your buffer is full and your investing is automatic.",
      actions: [
        {
          id: "wealth-stepup",
          stepId: "wealth",
          title: "Raise the amount by around 10% each year",
          why: "A contribution that never rises is a savings rate that quietly falls in real terms every year.",
          flagged: bufferProgress >= 1 && savingsProgress >= 1,
        },
        {
          id: "wealth-review",
          stepId: "wealth",
          title: "Review costs and allocation once a year — no more often",
          why: "Checking more frequently reliably costs more in switching than it earns in timing.",
          flagged: bufferProgress >= 1 && savingsProgress >= 1,
          selfAttested: true,
        },
      ],
    },
  ];

  // Priority reorders the two middle stages and nothing else. Debt is always
  // first — no stated preference makes a revolving balance worth keeping —
  // and compounding is always last because it depends on the other three.
  const middle = priority === "growth" ? ["invest", "buffer"] : ["buffer", "invest"];
  const order: StepKey[] = ["debt", ...middle, "wealth"] as StepKey[];
  const ordered = order.map((id) => steps.find((s) => s.id === id)!);

  // The first stage that is not finished is the one asking for attention;
  // everything after it is upcoming. Exactly one stage is ever "attention",
  // which is the whole point of a ladder.
  let attentionTaken = false;
  const withStatus: PlanStep[] = ordered.map((step, i) => {
    let status: PlanStatus;
    if (step.progress >= 1) {
      status = "complete";
    } else if (!attentionTaken) {
      status = "attention";
      attentionTaken = true;
    } else {
      status = "upcoming";
    }
    return { ...step, n: i + 1, status };
  });

  const actions = withStatus.flatMap((s) => s.actions);
  const completedCount = actions.filter((a) => done[a.id]).length;

  return {
    steps: withStatus,
    actions,
    open: actions.filter((a) => a.flagged && !done[a.id]),
    completedCount,
    totalCount: actions.length,
    progress: actions.length ? completedCount / actions.length : 0,
  };
}

/* ------------------------------------------------------------ opportunity */

export type Opportunity = {
  /** Short headline. Names the condition, never the person. */
  title: string;
  /**
   * How loudly to render it.
   *
   * `critical` is reserved for money actively being lost — a revolving
   * balance, or spending past a line the student themselves set. Falling
   * short of a savings target is a gap, not an emergency, and colouring it
   * red is how a product teaches people to ignore red.
   */
  tone: "critical" | "default" | "positive";
  /** One sentence with the figure in it. */
  detail: string;
  /** Rupees per month, where the opportunity is an amount. */
  amount: number | null;
  /** Where the fix lives. */
  href: string;
  actionLabel: string;
  /** True when there is nothing to fix — the page says so plainly. */
  clear: boolean;
};

/**
 * The single largest thing worth doing this month, chosen in the order a
 * planner would: stop the bleeding, then build the buffer, then invest.
 *
 * Exactly one is returned. A list of five opportunities is a list of none.
 */
export function biggestOpportunity(input: PlanInput): Opportunity {
  const { allowance, totals, wantsThreshold, emergencyFund, emergencyTarget, debtTotal } = input;

  const wantsExcess = Math.max(0, (totals.Wants ?? 0) - allowance * wantsThreshold);
  const savingsShortfall = Math.max(0, allowance * RULE.savings - (totals.Savings ?? 0));
  const bufferHeld = emergencyFund ?? totals.Savings ?? 0;
  const bufferShortfall = Math.max(0, emergencyTarget - bufferHeld);

  if ((debtTotal ?? 0) > 0) {
    return {
      title: "Your costliest money is borrowed money",
      tone: "critical",
      detail:
        "You have an outstanding balance. Interest on it will almost certainly outrun anything the same rupee earns invested, so clearing it comes first.",
      amount: debtTotal,
      href: "/plan",
      actionLabel: "See the plan",
      clear: false,
    };
  }

  if (wantsExcess > 0) {
    return {
      title: "Discretionary spending is above your target",
      tone: "critical",
      detail:
        "That is the largest amount you could redirect this month without earning a rupee more.",
      amount: wantsExcess,
      href: "/spending",
      actionLabel: "Review spending",
      clear: false,
    };
  }

  if (savingsShortfall > 0) {
    return {
      title: "Your savings rate is below target",
      tone: "default",
      detail:
        "Closing the gap is what turns a month that balanced into a month that built something.",
      amount: savingsShortfall,
      href: "/what-if",
      actionLabel: "See what it becomes",
      clear: false,
    };
  }

  if (bufferShortfall > 0) {
    return {
      title: "Your emergency buffer is short of three months",
      tone: "default",
      detail:
        "Everything else is on target. This is the last thing standing between you and a month that goes wrong being survivable.",
      amount: bufferShortfall,
      href: "/plan",
      actionLabel: "See the plan",
      clear: false,
    };
  }

  return {
    title: "Nothing is off target this month",
    tone: "positive",
    detail:
      "Your essentials, discretionary spending and savings are all within their guidelines, and your buffer covers three months. Hold the line as your income rises — that is where this usually slips.",
    amount: null,
    href: "/what-if",
    actionLabel: "Explore scenarios",
    clear: true,
  };
}
