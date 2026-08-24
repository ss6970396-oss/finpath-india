/**
 * GOLDEN TESTS — the financial engines are frozen here.
 *
 * Every expectation in this file is read from lib/__fixtures__/*.json, which
 * were generated from the implementations as they stood before the rebuild.
 * Those files are AUTHORITATIVE.
 *
 *   A failure here means the implementation changed.
 *   Fix the implementation. Never edit a fixture to make a test pass.
 *
 * The one legitimate reason to regenerate a fixture is a deliberate, approved
 * change to financial behaviour — and then the regeneration is the change
 * under review, not a side effect of one.
 *
 * Coverage:
 *   50/30/20      twelve scenarios, end to end from CSV through the ratios,
 *                 the health score and the guilt-free figure
 *   classifier    the merchant -> bucket decision, including the residual
 *   compounding   sipFutureValue, lumpSumFutureValue, buildProjection
 *   step-up       stepUpSeries, flatSeries, delayedSeries
 *   FI-age        lifestyleCreep
 *   stress test   runway against each shock
 *
 * NaN is encoded in the fixtures as the string "NaN", because JSON has no
 * literal for it. See `expectValue` below and finding F-01 in docs/audit.md:
 * sipFutureValue currently returns NaN at a 0% rate. That is recorded here as
 * present behaviour, not endorsed as correct.
 */

import { describe, expect, it } from "vitest";

import { classify, parseStatement } from "./csv";
import {
  SHOCKS,
  delayedSeries,
  flatSeries,
  guiltFree,
  healthScore,
  lifestyleCreep,
  lumpSumFutureValue,
  multiple,
  ratios,
  runway,
  stepUpSeries,
  variance,
} from "./finance";
import { buildProjection, sipFutureValue } from "./sip";
import { SCENARIOS, toCsv } from "./__fixtures__/scenarios";
import { bucketTotals } from "./__fixtures__/bucket";

import golden503020 from "./__fixtures__/golden-503020.json";
import goldenClassify from "./__fixtures__/golden-classify.json";
import goldenCompounding from "./__fixtures__/golden-compounding.json";
import goldenStepUp from "./__fixtures__/golden-stepup.json";
import goldenFiAge from "./__fixtures__/golden-fi-age.json";
import goldenStress from "./__fixtures__/golden-stress-test.json";

/** Two decimal places, matching the precision the fixtures were written at. */
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Assert one number against its frozen value, honouring the "NaN" encoding.
 * A NaN that becomes a real number (or the reverse) fails, which is the point.
 */
function expectValue(actual: number, expected: number | string, label: string) {
  if (expected === "NaN") {
    expect(Number.isNaN(actual), `${label} should still be NaN`).toBe(true);
  } else {
    expect(actual, label).toBe(expected);
  }
}

/* ------------------------------------------------------------- 50/30/20 */

describe("golden: 50/30/20", () => {
  it("covers every scenario in the fixture, and no more", () => {
    expect(golden503020.map((c) => c.id)).toEqual(SCENARIOS.map((s) => s.id));
    expect(golden503020).toHaveLength(12);
  });

  for (const expected of golden503020) {
    describe(`${expected.id} — ${expected.intent}`, () => {
      const scenario = SCENARIOS.find((s) => s.id === expected.id)!;
      const parsed = parseStatement(toCsv(scenario));
      const aggregate = bucketTotals(parsed.transactions);

      it("parses the statement identically", () => {
        expect(parsed.shape).toBe(expected.parse.shape);
        expect(parsed.magnitudesOnly).toBe(expected.parse.magnitudesOnly);
        expect(parsed.skipped).toBe(expected.parse.skipped);
        expect(parsed.errors).toEqual(expected.parse.errors);
        expect(parsed.transactions).toHaveLength(expected.parse.txnCount);
        expect(
          parsed.transactions.map((t) => ({
            merchant: t.merchant,
            amount: t.amount,
            direction: t.direction,
            category: t.category,
            categorySource: t.categorySource,
          })),
        ).toEqual(expected.parse.categories);
      });

      it("aggregates into the same buckets", () => {
        expect(aggregate.totals).toEqual(expected.totals);
        expect(aggregate.income).toBe(expected.income);
        expect(aggregate.spend).toBe(expected.spend);
      });

      it("produces the same ratios and variance", () => {
        const r = ratios(aggregate.totals, scenario.allowance);
        const v = variance(r);
        expect({
          Needs: round2(r.Needs),
          Wants: round2(r.Wants),
          Savings: round2(r.Savings),
        }).toEqual(expected.ratios);
        expect({
          Needs: round2(v.Needs),
          Wants: round2(v.Wants),
          Savings: round2(v.Savings),
        }).toEqual(expected.variance);
      });

      it("produces the same health score", () => {
        const h = healthScore(aggregate.totals, scenario.allowance);
        expect({ score: h.score, band: h.band, parts: h.parts }).toEqual(
          expected.health,
        );
      });

      it("produces the same guilt-free figure", () => {
        const g = guiltFree(aggregate.totals, scenario.allowance);
        expect({
          fixed: round2(g.fixed),
          investmentTarget: round2(g.investmentTarget),
          safeToSpend: round2(g.safeToSpend),
          alreadySpentOnWants: round2(g.alreadySpentOnWants),
          remaining: round2(g.remaining),
          perDay: round2(g.perDay),
        }).toEqual(expected.guiltFree);
      });
    });
  }
});

/* ------------------------------------------------------------ classifier */

describe("golden: classifier", () => {
  for (const row of goldenClassify) {
    it(`${row.merchant || "(empty string)"} -> ${row.category}`, () => {
      expect(classify(row.merchant)).toEqual({
        category: row.category,
        source: row.source,
      });
    });
  }

  it("never files an unclaimed merchant as Wants", () => {
    // The residual must stay Uncategorised: defaulting it into Wants would
    // make the 30% rule police the parser's ignorance.
    for (const row of goldenClassify) {
      if (row.source === "none") expect(row.category).toBe("Uncategorised");
    }
  });
});

/* ----------------------------------------------------------- compounding */

describe("golden: compounding", () => {
  it("sipFutureValue matches every frozen point", () => {
    for (const c of goldenCompounding.sipFutureValue) {
      expectValue(
        sipFutureValue(c.monthly, c.years, c.rate),
        c.value,
        `sipFutureValue(${c.monthly}, ${c.years}, ${c.rate})`,
      );
    }
  });

  it("lumpSumFutureValue matches every frozen point", () => {
    for (const c of goldenCompounding.lumpSumFutureValue) {
      const future = lumpSumFutureValue(c.amount, c.years, c.rate);
      expectValue(
        future,
        c.future,
        `lumpSumFutureValue(${c.amount}, ${c.years}, ${c.rate})`,
      );
      expectValue(
        round2(multiple(c.amount, future)),
        c.multiple,
        `multiple(${c.amount}, ${future})`,
      );
    }
  });

  it("buildProjection matches the frozen series", () => {
    for (const c of goldenCompounding.buildProjection) {
      expect(buildProjection(c.monthly, c.params)).toEqual(c.series);
    }
  });
});

/* --------------------------------------------------------------- step-up */

describe("golden: step-up", () => {
  it("stepUpSeries matches every frozen series", () => {
    for (const c of goldenStepUp.stepUpSeries) {
      expect(
        stepUpSeries(c.monthly, c.years, c.rate, c.stepUp),
        `stepUpSeries(${c.monthly}, ${c.years}, ${c.rate}, ${c.stepUp})`,
      ).toEqual(c.series);
    }
  });

  it("flatSeries matches every frozen series", () => {
    for (const c of goldenStepUp.flatSeries) {
      expect(flatSeries(c.monthly, c.years, c.rate)).toEqual(c.series);
    }
  });

  it("delayedSeries matches every frozen series", () => {
    for (const c of goldenStepUp.delayedSeries) {
      expect(
        delayedSeries(c.monthly, c.years, c.rate, c.delayYears),
        `delayedSeries delay=${c.delayYears}`,
      ).toEqual(c.series);
    }
  });

  it("a step-up never trails the flat SIP it steps up from", () => {
    for (const c of goldenStepUp.stepUpSeries) {
      if (c.stepUp === 0) continue;
      const flat = stepUpSeries(c.monthly, c.years, c.rate, 0);
      const stepped = stepUpSeries(c.monthly, c.years, c.rate, c.stepUp);
      for (let i = 0; i < flat.length; i++) {
        expect(stepped[i].value).toBeGreaterThanOrEqual(flat[i].value);
      }
    }
  });
});

/* ---------------------------------------------------------------- FI-age */

describe("golden: FI-age", () => {
  for (const c of goldenFiAge) {
    it(`income ${c.annualIncome}, invest ${c.investShare}, rate ${c.annualRate}`, () => {
      const r = lifestyleCreep(
        c.annualIncome,
        c.investShare,
        c.annualRate,
        c.currentAge,
        c.withdrawalRate,
      );
      expect({
        monthlyIncome: round2(r.monthlyIncome),
        monthlyInvested: round2(r.monthlyInvested),
        monthlyOverhead: round2(r.monthlyOverhead),
        annualOverhead: round2(r.annualOverhead),
        corpusTarget: round2(r.corpusTarget),
        yearsToFI: r.yearsToFI,
        fiAge: r.fiAge,
      }).toEqual(c.result);
    });
  }

  it("reports no FI date rather than a wrong one when nothing is invested", () => {
    for (const c of goldenFiAge) {
      if (c.investShare === 0) {
        expect(c.result.yearsToFI).toBeNull();
        expect(c.result.fiAge).toBeNull();
      }
    }
  });
});

/* ----------------------------------------------------------- stress test */

describe("golden: stress test", () => {
  it("the shock catalogue is unchanged", () => {
    expect(SHOCKS).toEqual(goldenStress.shocks);
  });

  it("runway matches every frozen case", () => {
    for (const c of goldenStress.cases) {
      const shock = c.shockId
        ? SHOCKS.find((s) => s.id === c.shockId)
        : undefined;
      const r = runway(c.liquid, c.monthlyFixed, c.monthlyIncome, shock);
      expect(
        {
          liquid: round2(r.liquid),
          monthlyFixed: round2(r.monthlyFixed),
          survivedDays: r.survivedDays,
          shortfall: round2(r.shortfall),
          covered: r.covered,
        },
        `runway(${c.liquid}, ${c.monthlyFixed}, ${c.monthlyIncome}, ${c.shockId})`,
      ).toEqual(c.result);
    }
  });

  it("never reports both covered and a shortfall", () => {
    for (const c of goldenStress.cases) {
      if (c.result.covered) expect(c.result.shortfall).toBe(0);
      else expect(c.result.shortfall).toBeGreaterThan(0);
    }
  });
});

/* --------------------------------------------- cross-implementation guard */

describe("golden: the SIP mirror", () => {
  /**
   * sipFutureValue in lib/sip.ts and sip_future_value in backend/nudge.py are
   * the same formula written twice. The Python side is frozen in
   * backend/tests/fixtures/golden_nudge.json and asserted by
   * backend/tests/test_golden_nudge.py; this end asserts the TypeScript half
   * against the SAME grid of inputs, so the two fixtures can be diffed
   * mechanically and a drift shows up as a failing pair rather than a silent
   * disagreement in rupees.
   */
  it("agrees with the frozen backend grid on every non-zero rate", () => {
    const nonZero = goldenCompounding.sipFutureValue.filter((c) => c.rate !== 0);
    expect(nonZero.length).toBeGreaterThan(0);
    for (const c of nonZero) {
      expectValue(
        sipFutureValue(c.monthly, c.years, c.rate),
        c.value,
        `sipFutureValue(${c.monthly}, ${c.years}, ${c.rate})`,
      );
    }
  });
});
