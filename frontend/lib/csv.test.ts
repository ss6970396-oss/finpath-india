import { describe, expect, it } from "vitest";
import {
  classify,
  detectAllowance,
  parseAmount,
  parseStatement,
  SAMPLE_CSV,
  skippedToCsv,
  type ParseResult,
} from "./csv";

/** Rows come back newest-first, so look them up by name rather than index. */
function row(result: ParseResult, merchant: string) {
  const found = result.transactions.find((t) => t.merchant === merchant);
  if (!found) throw new Error(`no transaction for ${merchant}`);
  return found;
}

function totals(result: ParseResult) {
  const out: Record<string, number> = {};
  for (const t of result.transactions) {
    if (t.direction === "in") continue;
    out[t.category] = (out[t.category] ?? 0) + t.amount;
  }
  return out;
}

/* ------------------------------------------------------------ parseAmount */

describe("parseAmount", () => {
  it("reads a plain number", () => {
    expect(parseAmount("3000")).toBe(3000);
    expect(parseAmount("1234.50")).toBe(1234.5);
  });

  it("strips the rupee sign and Indian comma grouping", () => {
    expect(parseAmount("₹1,08,240")).toBe(108240);
    expect(parseAmount("₹ 1,08,240 ")).toBe(108240);
    expect(parseAmount("12,500")).toBe(12500);
    expect(parseAmount("₹ 2,34,56,789.25")).toBe(23456789.25);
  });

  it("strips non-breaking and thin spaces", () => {
    expect(parseAmount("₹ 12,500")).toBe(12500);
    expect(parseAmount("12 500")).toBe(12500);
  });

  it("reads a unicode minus as negative", () => {
    expect(parseAmount("−450")).toBe(-450);
    expect(parseAmount("−₹1,250")).toBe(-1250);
  });

  it("reads a glued Dr/Cr suffix as the sign", () => {
    expect(parseAmount("1234.50Dr")).toBe(-1234.5);
    expect(parseAmount("500Cr")).toBe(500);
    expect(parseAmount("1,234 DR")).toBe(-1234);
    expect(parseAmount("Cr 900")).toBe(900);
  });

  it("reads accounting parentheses as negative", () => {
    expect(parseAmount("(1,234)")).toBe(-1234);
  });

  it("reads a trailing minus as negative", () => {
    expect(parseAmount("1234-")).toBe(-1234);
  });

  it("returns null only for genuinely unreadable cells", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("   ")).toBeNull();
    expect(parseAmount("N/A")).toBeNull();
    expect(parseAmount("-")).toBeNull();
    // Zero is a readable amount, not a parse failure.
    expect(parseAmount("0")).toBe(0);
  });
});

/* -------------------------------------------------------- shape (a) signed */

describe("signed amount column", () => {
  const csv = [
    "Date,Description,Amount",
    "2026-08-01,Monthly Allowance,15000",
    "2026-08-03,Swiggy,-340",
    "2026-08-05,Hostel Mess Fee,-3000",
    "2026-08-07,SIP - Index Fund,-1500",
  ].join("\n");

  const result = parseStatement(csv);

  it("binds the amount column and reports the shape", () => {
    expect(result.shape).toBe("signed");
    expect(result.columns.amount).toBe("Amount");
    expect(result.skipped).toBe(0);
  });

  it("treats the positive row as income, not spend", () => {
    expect(result.magnitudesOnly).toBe(false);
    expect(row(result, "Monthly Allowance").direction).toBe("in");
    expect(row(result, "Monthly Allowance").category).toBe("Income");
    expect(result.income).toBe(15000);
    expect(result.spend).toBe(4840);
  });

  it("keeps income out of the spend buckets", () => {
    expect(totals(result)).toEqual({ Wants: 340, Needs: 3000, Savings: 1500 });
  });

  it("reads an all-positive column as magnitudes, not as all income", () => {
    // A spend-only export carries no sign at all. Reading every row as income
    // would leave the ledger with zero spend.
    const spendOnly = parseStatement(
      ["Date,Description,Amount", "2026-08-03,Swiggy,340", "2026-08-05,Hostel Mess Fee,3000"].join("\n"),
    );
    expect(spendOnly.magnitudesOnly).toBe(true);
    expect(spendOnly.income).toBe(0);
    expect(spendOnly.spend).toBe(3340);
  });
});

/* -------------------------------------------------- shape (b) debit/credit */

describe("debit/credit pair", () => {
  const csv = [
    "Date,Narration,Debit,Credit",
    "2026-08-01,Monthly Allowance from Parents,,12500",
    "2026-08-02,Hostel Mess Fee,3000,",
    "2026-08-03,Swiggy,340,",
    "2026-08-06,Refund Swiggy Order,,120",
  ].join("\n");

  const result = parseStatement(csv);

  it("binds both columns and shows Credit in the mapping", () => {
    expect(result.shape).toBe("debit-credit");
    expect(result.columns.debit).toBe("Debit");
    expect(result.columns.credit).toBe("Credit");
  });

  it("accepts a credit-only row, with the debit cell empty", () => {
    const credit = row(result, "Monthly Allowance from Parents");
    expect(credit.direction).toBe("in");
    expect(credit.amount).toBe(12500);
    expect(result.skipped).toBe(0);
  });

  it("computes amount as credit minus debit", () => {
    expect(row(result, "Swiggy").direction).toBe("out");
    expect(row(result, "Swiggy").amount).toBe(340);
    expect(result.income).toBe(12620);
    expect(result.spend).toBe(3340);
  });

  it("accepts a row where only one of the two cells parses", () => {
    const partial = parseStatement(
      ["Date,Narration,Debit,Credit", "2026-08-02,Hostel Mess Fee,3000,N/A"].join("\n"),
    );
    expect(partial.skipped).toBe(0);
    expect(partial.transactions[0].amount).toBe(3000);
    expect(partial.transactions[0].direction).toBe("out");
  });

  it("skips a row where neither cell is readable, naming both columns", () => {
    const broken = parseStatement(
      [
        "Date,Narration,Debit,Credit",
        "2026-08-02,Hostel Mess Fee,3000,",
        "2026-08-04,Garbled Row,,",
      ].join("\n"),
    );
    expect(broken.skipped).toBe(1);
    expect(broken.skippedRows[0].row).toBe(3);
    expect(broken.skippedRows[0].narration).toBe("Garbled Row");
    expect(broken.skippedRows[0].reason).toBe(
      "no readable amount in Debit or Credit",
    );
  });
});

/* ------------------------------------------------------- shape (c) Dr/Cr */

describe("amount plus a Dr/Cr type column", () => {
  const csv = [
    "Date,Particulars,Amount,Dr/Cr",
    // Quoted, because the grouping comma is otherwise a field delimiter.
    '2026-08-01,Stipend,"₹12,500",Cr',
    "2026-08-04,Zomato,380,Dr",
    "2026-08-09,Apollo Pharmacy,410,DR",
  ].join("\n");

  const result = parseStatement(csv);

  it("prefers the typed shape over reading the amount as signed", () => {
    expect(result.shape).toBe("typed");
    expect(result.columns.amount).toBe("Amount");
    expect(result.columns.type).toBe("Dr/Cr");
    // The Dr/Cr header must not be mistaken for a Debit column.
    expect(result.columns.debit).toBeUndefined();
  });

  it("takes the direction from the type column", () => {
    expect(row(result, "Stipend").direction).toBe("in");
    expect(row(result, "Stipend").amount).toBe(12500);
    expect(row(result, "Zomato").direction).toBe("out");
    expect(result.income).toBe(12500);
    expect(result.spend).toBe(790);
  });

  it("skips a row whose type cell is unreadable", () => {
    const broken = parseStatement(
      ["Date,Particulars,Amount,Dr/Cr", "2026-08-04,Zomato,380,???"].join("\n"),
    );
    expect(broken.skipped).toBe(1);
    expect(broken.skippedRows[0].reason).toContain("unrecognised Dr/Cr value");
  });
});

/* -------------------------------------------------------- categorisation */

describe("categories", () => {
  it("routes an unrecognised merchant to Uncategorised, not Wants", () => {
    const c = classify("Sharma General Store");
    expect(c.category).toBe("Uncategorised");
    expect(c.source).toBe("none");
  });

  it("still claims known discretionary merchants for Wants", () => {
    expect(classify("Swiggy")).toEqual({ category: "Wants", source: "rule" });
    expect(classify("Myntra")).toEqual({ category: "Wants", source: "rule" });
  });

  it("keeps needs and savings rules intact", () => {
    expect(classify("Hostel Mess Fee").category).toBe("Needs");
    expect(classify("SIP - Index Fund").category).toBe("Savings");
    expect(classify("Apollo Pharmacy").category).toBe("Needs");
  });

  it("does not let an unknown merchant inflate the Wants total", () => {
    const result = parseStatement(
      [
        "Date,Description,Debit,Credit",
        "2026-08-03,Swiggy,340,",
        "2026-08-04,Sharma General Store,900,",
      ].join("\n"),
    );
    expect(totals(result)).toEqual({ Wants: 340, Uncategorised: 900 });
    expect(row(result, "Sharma General Store").categorySource).toBe("none");
  });
});

/* --------------------------------------------------- allowance detection */

describe("allowance detection", () => {
  it("suggests the dominant credit in a single-month statement", () => {
    const result = parseStatement(
      [
        "Date,Narration,Debit,Credit",
        "2026-08-01,Monthly Allowance from Parents,,12500",
        "2026-08-06,Refund Swiggy Order,,120",
        "2026-08-03,Swiggy,340,",
      ].join("\n"),
    );
    expect(result.allowanceSuggestion).toEqual({
      amount: 12500,
      date: "2026-08-01",
      occurrences: 1,
      share: 12500 / 12620,
    });
  });

  it("suggests a credit that recurs across months", () => {
    const result = parseStatement(
      [
        "Date,Narration,Debit,Credit",
        "2026-07-01,Stipend,,12500",
        "2026-08-01,Stipend,,12500",
        "2026-08-06,Refund,,500",
      ].join("\n"),
    );
    expect(result.allowanceSuggestion?.amount).toBe(12500);
    expect(result.allowanceSuggestion?.occurrences).toBe(2);
    expect(result.allowanceSuggestion?.date).toBe("2026-08-01");
  });

  it("suggests nothing when no credit reaches half of monthly income", () => {
    const result = parseStatement(
      [
        "Date,Narration,Debit,Credit",
        "2026-08-02,Refund A,,400",
        "2026-08-05,Refund B,,400",
        "2026-08-09,Refund C,,400",
      ].join("\n"),
    );
    // Each is a third of income; none is a plausible allowance.
    expect(result.allowanceSuggestion).toBeNull();
  });

  it("suggests nothing when there is no income at all", () => {
    expect(detectAllowance([])).toBeNull();
  });
});

/* ----------------------------------------------------------- skip report */

describe("skip reporting", () => {
  const result = parseStatement(
    [
      "Date,Description,Amount",
      "2026-08-03,Swiggy,-340",
      "not-a-date,Mystery Charge,-100",
      "2026-08-05,,-200",
      "2026-08-06,Zero Row,0",
    ].join("\n"),
  );

  it("records the row number, the narration and the failing field", () => {
    expect(result.skipped).toBe(3);
    expect(result.skippedRows.map((r) => r.row)).toEqual([3, 4, 5]);
    expect(result.skippedRows[0].narration).toBe("Mystery Charge");
    expect(result.skippedRows[0].reason).toContain("unrecognised date format");
    expect(result.skippedRows[1].reason).toContain("no description");
    expect(result.skippedRows[2].reason).toBe("amount is ₹0");
  });

  it("serialises the skipped rows to CSV, quoting embedded commas", () => {
    const csv = skippedToCsv(result.skippedRows);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("Row,Narration,Reason,Original line");
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('"not-a-date,Mystery Charge,-100"');
  });
});

/* ------------------------------------------------------------- the template */

describe("the downloadable template", () => {
  const result = parseStatement(SAMPLE_CSV);

  it("parses cleanly through the shape it advertises", () => {
    expect(result.errors).toHaveLength(0);
    expect(result.skipped).toBe(0);
    expect(result.shape).toBe("debit-credit");
  });

  it("demonstrates a credit row and produces an allowance suggestion", () => {
    expect(result.income).toBe(12500);
    expect(result.allowanceSuggestion?.amount).toBe(12500);
  });
});

/* -------------------------------------------------------- file-level errors */

describe("unusable files", () => {
  it("reports an empty file", () => {
    expect(parseStatement("").errors).toHaveLength(1);
    expect(parseStatement("Date,Description,Amount").errors).toHaveLength(1);
  });

  it("names the columns it could not find", () => {
    const result = parseStatement("Foo,Bar\n1,2");
    expect(result.shape).toBe("none");
    expect(result.errors[0]).toContain("amount (or a Debit/Credit pair)");
    expect(result.errors[0]).toContain("Found: Foo, Bar");
  });
});
