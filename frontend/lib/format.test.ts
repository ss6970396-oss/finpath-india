/**
 * Tests for the formatting layer (§14).
 *
 * The examples in §14 are asserted verbatim, because they are the spec:
 *
 *   ₹1,50,000   ₹75,000   ₹1.5L   ₹1.2Cr   +4.2%   04 Aug 2026   Aug 2026
 *
 * and the forbidden forms are asserted to be absent:
 *
 *   ₹150,000 (Western grouping)   ₹150K   ₹1.5M
 */

import { describe, expect, it } from "vitest";

import {
  formatCompactINR,
  formatCount,
  formatDate,
  formatINR,
  formatMonth,
  formatPercent,
  prettySource,
} from "./format";
import {
  addPaise,
  clampAtZero,
  inrToWords,
  paise,
  ratioOfPaise,
  rupees,
  rupeesToPaise,
  shareOfPaise,
  subPaise,
  sumPaise,
  toEngineRupees,
} from "./money";

/* ------------------------------------------------------------ the money layer */

describe("paise", () => {
  it("converts rupees to integer paise", () => {
    expect(rupeesToPaise(1)).toBe(100);
    expect(rupeesToPaise(1234.56)).toBe(123456);
    expect(rupees(15000)).toBe(1500000);
  });

  it("rounds rather than truncating, so a paisa is never silently lost", () => {
    expect(rupeesToPaise(0.005)).toBe(1);
    expect(rupeesToPaise(0.004)).toBe(0);
    expect(rupeesToPaise(-1.005)).toBe(-100); // Math.round: -100.5 -> -100
  });

  it("never produces NaN from a non-finite input", () => {
    expect(rupeesToPaise(NaN)).toBe(0);
    expect(rupeesToPaise(Infinity)).toBe(0);
    expect(paise(NaN)).toBe(0);
  });

  it("adds exactly, where float rupees would not", () => {
    // The canonical float failure: 0.1 + 0.2 !== 0.3.
    expect(0.1 + 0.2).not.toBe(0.3);
    const a = rupeesToPaise(0.1);
    const b = rupeesToPaise(0.2);
    expect(addPaise(a, b)).toBe(rupeesToPaise(0.3));
  });

  it("stays exact over a month of transactions", () => {
    // 47 charges of ₹33.33. In float rupees this drifts; in paise it cannot.
    const items = Array.from({ length: 47 }, () => rupeesToPaise(33.33));
    expect(sumPaise(items)).toBe(33 * 47 * 100 + 33 * 47);
    expect(toEngineRupees(sumPaise(items))).toBeCloseTo(1566.51, 10);
  });

  it("subtracts and clamps", () => {
    expect(subPaise(rupees(100), rupees(30))).toBe(rupees(70));
    expect(clampAtZero(subPaise(rupees(30), rupees(100)))).toBe(0);
  });

  it("takes a share and rounds to the paisa", () => {
    expect(shareOfPaise(rupees(15000), 0.3)).toBe(rupees(4500));
    expect(shareOfPaise(rupees(1), 1 / 3)).toBe(33);
  });

  it("is zero-safe on ratios", () => {
    expect(ratioOfPaise(rupees(30), rupees(100))).toBe(0.3);
    expect(ratioOfPaise(rupees(30), paise(0))).toBe(0);
  });

  it("sums an empty list to zero, not NaN", () => {
    expect(sumPaise([])).toBe(0);
  });
});

/* -------------------------------------------------------------------- formatINR */

describe("formatINR", () => {
  it("matches the §14 examples exactly", () => {
    expect(formatINR(rupees(150000))).toBe("₹1,50,000");
    expect(formatINR(rupees(75000))).toBe("₹75,000");
  });

  it("uses Indian grouping, never Western", () => {
    expect(formatINR(rupees(150000))).not.toBe("₹150,000");
    expect(formatINR(rupees(10000000))).toBe("₹1,00,00,000");
    expect(formatINR(rupees(1234567))).toBe("₹12,34,567");
  });

  it("shows whole rupees by default and paise on request", () => {
    expect(formatINR(rupeesToPaise(1234.5))).toBe("₹1,235");
    expect(formatINR(rupeesToPaise(1234.5), true)).toBe("₹1,234.50");
  });

  it("handles zero and negatives", () => {
    expect(formatINR(paise(0))).toBe("₹0");
    expect(formatINR(rupees(-4280))).toBe("-₹4,280");
  });
});

/* ------------------------------------------------------------- formatCompactINR */

describe("formatCompactINR", () => {
  it("matches the §14 examples exactly", () => {
    expect(formatCompactINR(rupees(150000))).toBe("₹1.5L");
    expect(formatCompactINR(rupees(12000000))).toBe("₹1.2Cr");
  });

  it("never emits the forbidden K or M forms", () => {
    for (const value of [1000, 15000, 75000, 99999]) {
      const out = formatCompactINR(rupees(value));
      expect(out).not.toMatch(/[KM]/);
    }
    // Below a lakh it stays a full, honest figure.
    expect(formatCompactINR(rupees(75000))).toBe("₹75,000");
  });

  it("trims trailing zeros so a compact figure stays compact", () => {
    expect(formatCompactINR(rupees(200000))).toBe("₹2L");
    expect(formatCompactINR(rupees(20000000))).toBe("₹2Cr");
  });

  it("switches units exactly at a lakh and a crore", () => {
    expect(formatCompactINR(rupees(99999))).toBe("₹99,999");
    expect(formatCompactINR(rupees(100000))).toBe("₹1L");
    expect(formatCompactINR(rupees(9999999))).toBe("₹100L");
    expect(formatCompactINR(rupees(10000000))).toBe("₹1Cr");
  });
});

/* ----------------------------------------------------------------- formatPercent */

describe("formatPercent", () => {
  it("matches the §14 example exactly", () => {
    expect(formatPercent(0.042, { signed: true })).toBe("+4.2%");
  });

  it("takes a fraction, not a percentage", () => {
    expect(formatPercent(0.3)).toBe("30.0%");
    expect(formatPercent(0.3, { digits: 0 })).toBe("30%");
  });

  it("only signs positives, and only when asked", () => {
    expect(formatPercent(0.042)).toBe("4.2%");
    expect(formatPercent(-0.042, { signed: true })).toBe("-4.2%");
    expect(formatPercent(0, { signed: true })).toBe("0.0%");
  });

  it("returns an em dash rather than NaN%", () => {
    expect(formatPercent(NaN)).toBe("—");
    expect(formatPercent(Infinity)).toBe("—");
  });
});

/* -------------------------------------------------------------------- dates */

describe("formatDate and formatMonth", () => {
  it("matches the §14 examples exactly", () => {
    expect(formatDate("2026-08-04")).toBe("04 Aug 2026");
    expect(formatMonth("2026-08-04")).toBe("Aug 2026");
  });

  it("accepts a bare year-month", () => {
    expect(formatMonth("2026-08")).toBe("Aug 2026");
  });

  it("does not shift the date across a timezone boundary", () => {
    // The bug this guards: `new Date("2026-08-04")` is midnight UTC, and
    // formatting it in any zone west of Greenwich renders the 3rd. A
    // transaction dated the 4th must never display as the 3rd.
    expect(formatDate("2026-01-01")).toBe("01 Jan 2026");
    expect(formatDate("2026-12-31")).toBe("31 Dec 2026");
  });

  it("returns the input unchanged when it cannot be parsed", () => {
    expect(formatDate("not a date")).toBe("not a date");
    expect(formatMonth("")).toBe("");
  });
});

/* -------------------------------------------------------------------- misc */

describe("formatCount", () => {
  it("groups counts the Indian way", () => {
    expect(formatCount(1204)).toBe("1,204");
    expect(formatCount(1234567)).toBe("12,34,567");
  });

  it("returns an em dash rather than NaN", () => {
    expect(formatCount(NaN)).toBe("—");
  });
});

describe("prettySource", () => {
  it("turns a filename into a readable title", () => {
    expect(prettySource("FE_Handbook_Eng.pdf")).toBe("FE Handbook Eng");
    expect(prettySource("collegestudents.pdf")).toBe("collegestudents");
  });
});

/* ------------------------------------------------------- accessible label */

describe("inrToWords", () => {
  it("speaks Indian units, because that is how the figure is grouped", () => {
    expect(inrToWords(rupees(1234567))).toBe(
      "twelve lakh thirty four thousand five hundred sixty seven rupees",
    );
    expect(inrToWords(rupees(4280))).toBe(
      "four thousand two hundred eighty rupees",
    );
    expect(inrToWords(rupees(12000000))).toBe("one crore twenty lakh rupees");
  });

  it("handles zero and negatives", () => {
    expect(inrToWords(paise(0))).toBe("zero rupees");
    expect(inrToWords(rupees(-500))).toBe("minus five hundred rupees");
  });

  it("never announces a bare digit string", () => {
    // The whole point: a tabular figure read glyph by glyph is useless.
    expect(inrToWords(rupees(4280))).not.toMatch(/\d/);
  });
});
