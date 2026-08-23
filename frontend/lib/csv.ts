/**
 * Bank/UPI statement CSV parser.
 *
 * Runs entirely in the browser — an uploaded statement is never sent to the
 * API or to disk. Column names vary wildly between banks, so headers are
 * matched by alias rather than position.
 */

import { tagFor } from "./tags";

export type ParsedTxn = {
  id: number;
  date: string; // ISO yyyy-mm-dd
  merchant: string;
  amount: number;
  category: "Needs" | "Wants" | "Savings";
};

export type ParseResult = {
  transactions: ParsedTxn[];
  skipped: number;
  errors: string[];
  columns: { date: string; merchant: string; amount: string };
};

const DATE_KEYS = ["date", "txn date", "transaction date", "value date", "posted"];
const NAME_KEYS = ["merchant", "description", "narration", "particulars", "details", "remarks"];
const AMT_KEYS = ["amount", "debit", "withdrawal", "amount (inr)", "amt", "value"];

/** Split one CSV line, honouring double-quoted fields containing commas. */
export function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += c;
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      out.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

function findKey(headers: string[], aliases: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const i = lower.indexOf(alias);
    if (i !== -1) return headers[i];
  }
  for (const alias of aliases) {
    const i = lower.findIndex((h) => h.includes(alias));
    if (i !== -1) return headers[i];
  }
  return null;
}

/** Accepts dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, dd-MMM-yyyy. */
export function normaliseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const yyyy = y.length === 2 ? `20${y}` : y;
    return `${yyyy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const dMy = s.match(/^(\d{1,2})[\s\-/]([A-Za-z]{3,})[\s\-/](\d{2,4})$/);
  if (dMy) {
    const [, d, mon, y] = dMy;
    const mi = MON.indexOf(mon.slice(0, 3).toLowerCase());
    if (mi !== -1) {
      const yyyy = y.length === 2 ? `20${y}` : y;
      return `${yyyy}-${String(mi + 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return null;
}

/** Strips currency symbols, thousands separators and trailing Dr/Cr flags. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw
    .replace(/[₹$,\s]/g, "")
    .replace(/[()]/g, "")
    // Indian statements suffix "Dr"/"Cr" directly onto the figure
    // ("1234.50Dr"), so this cannot rely on a word boundary.
    .replace(/(dr|cr)\.?$/i, "")
    .trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.abs(n) : null;
}

/**
 * Classify a statement row. Savings first (an investment debit is not a
 * "want"), then the shared merchant tag table, then Wants as the residual —
 * the conservative default, since it is the bucket the nudge engine polices.
 */
/**
 * Word-bounded, NOT substring. Naive `includes` matching is actively
 * dangerous here: "rd " matches "ca[rd ]topup" and files a metro top-up as an
 * investment, and "fee" matches "cof[fee]" and files a coffee shop as a need.
 * Both inflate the health score off mis-bucketed money, so every pattern
 * below is anchored.
 */
const SAVINGS_PATTERNS = [
  /\bsip\b/, /\bmutual\s*fund/, /\bindex\s*fund/, /\brd\b/,
  /\brecurring\s+deposit\b/, /\bppf\b/, /\bnps\b/, /\belss\b/, /\binvest/,
];

const NEEDS_PATTERNS = [
  /\brent\b/, /\bhostel\b/, /\bmess\b/, /\bfees?\b/, /\btuition\b/,
  /\belectricity\b/, /\bpharmacy\b/, /\bmedical\b/, /\brecharge\b/,
];

const NEEDS_TAGS = new Set(["Transit", "Books", "Health", "Home"]);

export function classify(merchant: string): ParsedTxn["category"] {
  const m = merchant.toLowerCase();
  if (SAVINGS_PATTERNS.some((re) => re.test(m))) return "Savings";

  const tag = tagFor(merchant);
  if (tag === "Invest") return "Savings";
  if (NEEDS_TAGS.has(tag)) return "Needs";
  if (tag === "Sub") return "Needs";

  if (NEEDS_PATTERNS.some((re) => re.test(m))) return "Needs";

  return "Wants";
}

export function parseStatement(text: string): ParseResult {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      transactions: [],
      skipped: 0,
      errors: ["File appears empty, or has a header with no rows."],
      columns: { date: "", merchant: "", amount: "" },
    };
  }

  const headers = splitLine(lines[0]);
  const dateKey = findKey(headers, DATE_KEYS);
  const nameKey = findKey(headers, NAME_KEYS);
  const amtKey = findKey(headers, AMT_KEYS);

  if (!dateKey || !nameKey || !amtKey) {
    const missing = [
      !dateKey && "date",
      !nameKey && "description/merchant",
      !amtKey && "amount",
    ].filter(Boolean);
    return {
      transactions: [],
      skipped: lines.length - 1,
      errors: [
        `Could not find a ${missing.join(", ")} column. Found: ${headers.join(", ")}`,
      ],
      columns: { date: "", merchant: "", amount: "" },
    };
  }

  const di = headers.indexOf(dateKey);
  const ni = headers.indexOf(nameKey);
  const ai = headers.indexOf(amtKey);

  const transactions: ParsedTxn[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const date = normaliseDate(cells[di] ?? "");
    const merchant = (cells[ni] ?? "").replace(/\s+/g, " ").trim();
    const amount = parseAmount(cells[ai] ?? "");

    if (!date || !merchant || amount === null || amount === 0) {
      skipped++;
      if (errors.length < 3) {
        errors.push(`Row ${i + 1} skipped: could not read date, merchant or amount.`);
      }
      continue;
    }
    transactions.push({
      id: transactions.length + 1,
      date,
      merchant,
      amount: Math.round(amount),
      category: classify(merchant),
    });
  }

  transactions.sort((a, b) => (a.date < b.date ? 1 : -1));
  return {
    transactions,
    skipped,
    errors,
    columns: { date: dateKey, merchant: nameKey, amount: amtKey },
  };
}

/** Downloadable template so the expected shape is never a guess. */
export const SAMPLE_CSV = `Date,Description,Amount
2026-08-02,Hostel Mess Fee,3000
2026-08-03,Swiggy,340
2026-08-05,Metro Card Topup,300
2026-08-07,SIP - Index Fund,1500
2026-08-09,Cafe Coffee Day,220
2026-08-12,Myntra,1250
2026-08-15,Apollo Pharmacy,410
2026-08-18,Zomato,380
2026-08-21,Spotify Premium,119
2026-08-24,Xerox & Stationery,90
`;
