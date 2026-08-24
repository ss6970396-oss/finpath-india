/**
 * Golden-test scenario definitions — the INPUT half of the freeze.
 *
 * These describe the twelve 50/30/20 situations the rebuild must keep
 * behaving identically on. They are plain data: no expected values live here,
 * because expectations belong in the generated fixture JSON next to this file
 * (golden-503020.json), which is the authoritative record.
 *
 * Each scenario is expressed as a bank statement in the Debit/Credit shape,
 * so running it exercises the whole 50/30/20 path end to end:
 *
 *   parseStatement -> classify -> bucket totals -> ratios / health / guiltFree
 *
 * Adding a scenario is fine. CHANGING one invalidates the frozen expectations
 * for it and must be done deliberately, never to make a failing test pass.
 */

export type Scenario = {
  id: string;
  /** What the case is actually probing. */
  intent: string;
  /** Monthly allowance (income) the ratios are measured against. */
  allowance: number;
  /** Statement rows: [date, description, debit, credit]. */
  rows: [string, string, string, string][];
};

const M = "2026-08";

/** Debit row helper. */
const d = (day: number, merchant: string, amount: number): [string, string, string, string] => [
  `${M}-${String(day).padStart(2, "0")}`,
  merchant,
  String(amount),
  "",
];

/** Credit row helper. */
const c = (day: number, merchant: string, amount: number): [string, string, string, string] => [
  `${M}-${String(day).padStart(2, "0")}`,
  merchant,
  "",
  String(amount),
];

export const SCENARIOS: Scenario[] = [
  {
    id: "01-normal-income",
    intent:
      "An ordinary hostel month: allowance credited, spend spread across all three buckets.",
    allowance: 15000,
    rows: [
      c(1, "Monthly Allowance from Parents", 15000),
      d(2, "Hostel Mess Fee", 3000),
      d(3, "Mobile Recharge", 299),
      d(4, "Apollo Pharmacy", 410),
      d(6, "Swiggy", 340),
      d(8, "Zomato", 380),
      d(11, "Myntra", 1250),
      d(14, "Spotify Premium", 119),
      d(16, "SIP - Index Fund", 1500),
      d(20, "RD Deposit", 500),
    ],
  },
  {
    id: "02-zero-income",
    intent:
      "Allowance is zero. Every ratio divides by income, so this is the division-guard case.",
    allowance: 0,
    rows: [
      d(2, "Hostel Mess Fee", 3000),
      d(6, "Swiggy", 340),
      d(16, "SIP - Index Fund", 1500),
    ],
  },
  {
    id: "03-income-below-expenses",
    intent:
      "Spend exceeds the allowance. Ratios go above 1.0 and the unspent buffer must not go negative.",
    allowance: 8000,
    rows: [
      c(1, "Monthly Allowance from Parents", 8000),
      d(2, "Hostel Mess Fee", 3200),
      d(3, "Tuition Fees", 4000),
      d(9, "Zomato", 460),
      d(12, "Myntra", 1400),
      d(18, "BookMyShow", 600),
      d(22, "Steam Games", 900),
    ],
  },
  {
    id: "04-no-transactions",
    intent:
      "Header only. Nothing was spent, so the score must reflect a full buffer, not a crash.",
    allowance: 15000,
    rows: [],
  },
  {
    id: "05-unclassifiable-merchant",
    intent:
      "A merchant no rule claims. It must land in Uncategorised — never silently in Wants.",
    allowance: 15000,
    rows: [
      c(1, "Monthly Allowance from Parents", 15000),
      d(4, "PAYTM*QR9F82K", 900),
      d(9, "UPI/DR/443982/RAJESH", 1200),
      d(15, "POS 4412 XXXX", 750),
    ],
  },
  {
    id: "06-unknown-merchant",
    intent:
      "Unknown merchants alongside known ones. The known rows still classify; the rest stay Uncategorised.",
    allowance: 15000,
    rows: [
      c(1, "Monthly Allowance from Parents", 15000),
      d(3, "Hostel Mess Fee", 3000),
      d(5, "Grocery Wala", 620),
      d(7, "Swiggy", 340),
      d(10, "Sharma General Store", 480),
      d(13, "Auto Rickshaw", 160),
    ],
  },
  {
    id: "07-negative-transaction",
    intent:
      "A debit written as a negative figure. Magnitude, not sign, must reach the bucket.",
    allowance: 15000,
    rows: [
      c(1, "Monthly Allowance from Parents", 15000),
      d(3, "Hostel Mess Fee", -3000),
      d(7, "Swiggy", -340),
      d(16, "SIP - Index Fund", -1500),
    ],
  },
  {
    id: "08-refund",
    intent:
      "A merchant refund arrives as a credit. Credits are income, never negative spend, and never enter a bucket.",
    allowance: 15000,
    rows: [
      c(1, "Monthly Allowance from Parents", 15000),
      d(5, "Myntra", 1250),
      c(9, "Myntra Refund", 1250),
      d(12, "Swiggy", 340),
    ],
  },
  {
    id: "09-duplicate-transaction",
    intent:
      "The same charge appears twice. Both count — de-duplication is not a parser responsibility.",
    allowance: 15000,
    rows: [
      c(1, "Monthly Allowance from Parents", 15000),
      d(6, "Swiggy", 340),
      d(6, "Swiggy", 340),
      d(6, "Swiggy", 340),
    ],
  },
  {
    id: "10-multiple-categories",
    intent:
      "All four spend buckets populated at once, including Uncategorised.",
    allowance: 15000,
    rows: [
      c(1, "Monthly Allowance from Parents", 15000),
      d(2, "Hostel Mess Fee", 3000),
      d(3, "Metro Card Topup", 300),
      d(5, "Swiggy", 340),
      d(6, "Cafe Coffee Day", 220),
      d(8, "Netflix", 199),
      d(11, "SIP - Index Fund", 1500),
      d(14, "PPF Contribution", 1000),
      d(17, "PAYTM*QR9F82K", 900),
      d(21, "Sharma General Store", 480),
    ],
  },
  {
    id: "11-large-transaction",
    intent:
      "A single outflow far larger than the allowance. Ratios and the score must degrade smoothly, not wrap.",
    allowance: 15000,
    rows: [
      c(1, "Monthly Allowance from Parents", 15000),
      d(4, "Myntra", 250000),
      d(9, "Hostel Mess Fee", 3000),
    ],
  },
  {
    id: "12-unusual-distribution",
    intent:
      "Everything in one bucket. Wants at ~92% of allowance, nothing else — the shape the 30% rule exists for.",
    allowance: 15000,
    rows: [
      c(1, "Monthly Allowance from Parents", 15000),
      d(2, "Swiggy", 420),
      d(3, "Zomato", 460),
      d(4, "BookMyShow", 600),
      d(6, "Myntra", 1400),
      d(8, "Steam Games", 900),
      d(10, "Netflix", 649),
      d(12, "Starbucks", 480),
      d(14, "Blinkit", 320),
      d(16, "Amazon", 2400),
      d(18, "Flipkart", 3100),
      d(20, "PVR", 700),
      d(22, "Nykaa", 1350),
      d(24, "Zepto", 290),
      d(26, "Dominos", 780),
    ],
  },
];

/** Render a scenario as the CSV text parseStatement receives. */
export function toCsv(s: Scenario): string {
  const head = "Date,Description,Debit,Credit";
  const body = s.rows.map((r) => r.join(","));
  return [head, ...body].join("\n") + "\n";
}
