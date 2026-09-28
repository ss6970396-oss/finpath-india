import { describe, expect, it } from "vitest";
import { buildPlan, type PlanInput } from "./plan";
import {
  ACTION_META,
  FALLBACK_META,
  actionMetaFor,
  actionPriority,
  priorities,
} from "./action-meta";

/** A student at the start: owes money, no buffer, not saving. */
const base: PlanInput = {
  allowance: 15000,
  totals: { Needs: 7000, Wants: 5000, Savings: 0, Uncategorised: 0 },
  ratio: { Needs: 7000 / 15000, Wants: 5000 / 15000, Savings: 0 },
  wantsThreshold: 0.3,
  emergencyFund: 0,
  emergencyTarget: 21000,
  debtTotal: 2000,
  priority: "balance",
  done: {},
};

describe("action metadata", () => {
  it("has an entry for every action the plan can produce", () => {
    const ids = buildPlan(base).actions.map((a) => a.id).sort();
    expect(Object.keys(ACTION_META).sort()).toEqual(ids);
  });

  it("every estimate is a positive whole number of minutes", () => {
    for (const [id, m] of Object.entries(ACTION_META)) {
      expect(Number.isInteger(m.estimatedMinutes), id).toBe(true);
      expect(m.estimatedMinutes, id).toBeGreaterThan(0);
    }
  });

  it("every link goes to a real in-app route", () => {
    const routes = new Set(["/home", "/plan", "/ask", "/profile", "/spending", "/what-if"]);
    for (const [id, m] of Object.entries(ACTION_META)) {
      if (m.action.kind === "link") expect(routes.has(m.action.href), id).toBe(true);
    }
  });

  it("falls back for an unknown id rather than throwing", () => {
    expect(actionMetaFor("not-an-action")).toBe(FALLBACK_META);
  });
});

describe("actionPriority — derived from the plan's ladder", () => {
  it("debt stage live: debt actions high, the next stage medium, the rest low", () => {
    const plan = buildPlan(base);
    const p = priorities(plan);
    expect(p["debt-clear"]).toBe("high");
    expect(p["debt-later"]).toBe("high");
    expect(p["buffer-fund"]).toBe("medium"); // balance: buffer before invest
    expect(p["invest-sip"]).toBe("low");
    expect(p["wealth-review"]).toBe("low");
  });

  it("follows the plan when priority reorders the middle stages", () => {
    const plan = buildPlan({ ...base, priority: "growth" });
    const p = priorities(plan);
    expect(p["invest-sip"]).toBe("medium"); // growth: invest before buffer
    expect(p["buffer-fund"]).toBe("low");
  });

  it("skips completed stages when finding the medium stage", () => {
    // No debt, full buffer: debt and buffer complete, invest is live.
    const plan = buildPlan({ ...base, debtTotal: 0, emergencyFund: 21000 });
    const p = priorities(plan);
    expect(p["debt-clear"]).toBe("low");
    expect(p["buffer-fund"]).toBe("low");
    expect(p["invest-sip"]).toBe("high");
    expect(p["wealth-stepup"]).toBe("medium");
  });

  it("everything low when no stage needs attention", () => {
    const plan = buildPlan({
      ...base,
      debtTotal: 0,
      emergencyFund: 21000,
      totals: { Needs: 7000, Wants: 3000, Savings: 3000, Uncategorised: 0 },
      ratio: { Needs: 7000 / 15000, Wants: 0.2, Savings: 0.2 },
    });
    // wealth is 0.5 progress, so it stays "attention"; force the edge case.
    const allComplete = plan.steps.map((s) => ({ ...s, status: "complete" as const }));
    expect(actionPriority(allComplete, "wealth-review")).toBe("low");
  });

  it("an unknown id is low", () => {
    expect(actionPriority(buildPlan(base).steps, "nope")).toBe("low");
  });
});
