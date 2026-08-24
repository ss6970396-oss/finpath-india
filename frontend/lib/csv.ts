/**
 * Bank/UPI statement CSV parser.
 *
 * Runs entirely in the browser — an uploaded statement is never sent to the
 * API or to disk. Column names vary wildly between banks, so headers are
 * matched by alias rather than position, and the amount can arrive in any of
 * three shapes (see resolveAmountColumns).
 */

import { knownTagFor } from "./tags";

/** Spend buckets. `Uncategorised` is a real bucket, not a failure. */
export type SpendCategory = "Needs" | "Wants" | "Savings" | "Uncategorised";

/** Money coming in is not spend and never carries a spend bucket. */
export type TxnCategory = SpendCategory | "Income";

export type ParsedTxn = {
  id: number;
  date: string; // ISO yyyy-mm-dd
  merchant: string;
  /** Always a positive magnitude. `direction` carries the sign. */
  amount: number;
  direction: "in" | "out";
  category: TxnCategory;
  /**
   * How the category was decided. Only `rule` and `user` count toward the 30%
   * Wants rule; `none` marks a row still sitting in Uncategorised.
   */
  categorySource: "rule" | "user" | "none";
};

/** A row that produced no transaction, and precisely why. */
export type SkippedRow = {
  /** 1-based line number as it appears in the file, header included. */
  row: number;
  /** The description cell, or the raw line when even that could not be read. */
  narration: string;
  /** The specific failing field, e.g. "no readable amount in Debit or Credit". */
  reason: string;
  /** The original line, so the downloaded CSV is round-trippable. */
  raw: string;
};

/**
 * Which columns were bound. `amount`, `debit`, `credit` and `type` are only
 * present when that shape was the one detected.
 */
export type BoundColumns = {
  date: string;
  merchant: string;
  amount?: string;
  debit?: string;
  credit?: string;
  type?: string;
};

/** Which of the three amount shapes the file turned out to use. */
export type AmountShape = "signed" | "debit-credit" | "typed" | "none";

export type AllowanceSuggestion = {
  amount: number;
  /** ISO date of the most recent occurrence. */
  date: string;
  occurrences: number;
  /** Share of monthly income this credit represents, 0-1. */
  share: number;
};

export type ParseResult = {
  transactions: ParsedTxn[];
  skipped: number;
  skippedRows: SkippedRow[];
  /** File-level problems (empty file, no usable columns). Not row skips. */
  errors: string[];
  columns: BoundColumns;
  shape: AmountShape;
  /**
   * True when a signed-amount column held no negative value anywhere, so it
   * was read as magnitudes-only. See resolveSignConvention.
   */
  magnitudesOnly: boolean;
  income: number;
  spend: number;
  allowanceSuggestion: AllowanceSuggestion | null;
};

const DATE_KEYS = ["date", "txn date", "transaction date", "value date", "posted"];
const NAME_KEYS = ["merchant", "description", "narration", "particulars", "details", "remarks"];

// Shape (a): one column carrying the whole figure.
const SIGNED_KEYS = ["amount", "txn amount", "transaction amount", "amount (inr)", "amt", "value"];
// Shape (b): a pair. Matched separately so either side may be missing.
const DEBIT_KEYS = ["debit", "withdrawal", "withdrawal amt", "withdrawals", "dr", "debit amount"];
const CREDIT_KEYS = ["credit", "deposit", "deposits", "cr", "credit amount"];
// Shape (c): the sign lives in its own column.
const TYPE_KEYS = ["type", "dr/cr", "cr/dr", "drcr", "txn type", "transaction type", "indicator"];

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

/**
 * Aliases shorter than this are matched EXACTLY and never as a substring.
 *
 * "cr" is a legitimate header alias for the Credit column and is also sitting
 * inside the word "Des-cr-iption", which is the single most common
 * description header there is. Substring-matching it bound Description as the
 * Credit column on essentially every signed-amount file, which then made
 * every row unreadable. Two- and three-letter aliases carry no information
 * once you are matching loosely, so they only get the exact pass.
 */
const MIN_FUZZY_ALIAS = 4;

function findKey(headers: string[], aliases: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim());
  // Exact match first: "dr" must not be found inside "dr/cr".
  for (const alias of aliases) {
    const i = lower.indexOf(alias);
    if (i !== -1) return headers[i];
  }
  for (const alias of aliases) {
    if (alias.length < MIN_FUZZY_ALIAS) continue;
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

/**
 * Parse one money cell to a SIGNED number, or null when there is nothing
 * readable in it.
 *
 * Handles, in order: a Dr/Cr suffix glued to the figure ("1234.50Dr"),
 * accounting parentheses ("(1,234)" is negative), the rupee sign, Indian
 * comma grouping ("1,08,240" — grouping is stripped wholesale, so the
 * two-digit groups need no special case), ordinary and non-breaking spaces,
 * and the Unicode minus U+2212 that several bank exports emit instead of
 * ASCII hyphen.
 *
 * Returns null only for genuinely unreadable input. An EMPTY cell is also
 * null here; it is the caller that decides whether empty means zero, because
 * that answer differs by column shape.
 */
export function parseAmount(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;

  let sign = 1;

  // "1234.50Dr" / "500 CR" / "Dr 1234". No word boundary is possible on the
  // trailing form - the flag is routinely glued straight onto the digits.
  const trailing = s.match(/(dr|cr)\.?$/i);
  const leading = s.match(/^(dr|cr)\.?\b/i);
  if (trailing) {
    if (trailing[1].toLowerCase() === "dr") sign = -1;
    s = s.slice(0, trailing.index).trim();
  } else if (leading) {
    if (leading[1].toLowerCase() === "dr") sign = -1;
    s = s.slice(leading[0].length).trim();
  }

  // Accounting negative: (1,234).
  if (/^\(.*\)$/.test(s)) {
    sign *= -1;
    s = s.slice(1, -1).trim();
  }

  // Trailing-minus format: "1234-".
  if (/-\s*$/.test(s)) {
    sign *= -1;
    s = s.replace(/-\s*$/, "").trim();
  }

  s = s
    // Unicode minus, en dash, em dash - several exports use these for ASCII "-".
    .replace(/[\u2212\u2013\u2014]/g, "-")
    // Non-breaking, narrow no-break and thin spaces.
    .replace(/[\u00A0\u202F\u2009]/g, "")
    // Currency marks, Indian comma grouping (1,08,240) and ordinary spaces.
    .replace(/[\u20B9$\u20AC\u00A3,\s]/g, "");

  if (!s || !/\d/.test(s)) return null;

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n * sign;
}

/** Magnitude of a cell, for shapes where the sign comes from elsewhere. */
function magnitude(raw: string): number | null {
  const n = parseAmount(raw);
  return n === null ? null : Math.abs(n);
}

/* --------------------------------------------------------------- classify */

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

/**
 * Explicitly discretionary merchants. This list exists so that dropping the
 * "everything unknown is Wants" default does not empty the bucket the nudge
 * engine polices — a rule has to actually claim a row for it to count toward
 * the 30%. Deliberately narrow: cabs and groceries are absent because they
 * are genuinely ambiguous, and ambiguous is what Uncategorised is for.
 */
const WANTS_PATTERNS = [
  /\bswiggy\b/, /\bzomato\b/, /\bblinkit\b/, /\bzepto\b/, /\binstamart\b/,
  /\bdunzo\b/, /\bmyntra\b/, /\bajio\b/, /\bnykaa\b/, /\bflipkart\b/,
  /\bamazon\b/, /\bnetflix\b/, /\bhotstar\b/, /\bprime\s*video\b/,
  /\bspotify\b/, /\bbookmyshow\b/, /\bpvr\b/, /\binox\b/, /\bsteam\b/,
  /\bstarbucks\b/, /\bdomino/, /\bkfc\b/, /\bmcdonald/, /\bburger\s*king\b/,
  /\bcafe\b/, /\bcoffee\b/,
];

const NEEDS_TAGS = new Set(["Transit", "Books", "Health", "Home"]);

export type Classification = {
  category: SpendCategory;
  source: ParsedTxn["categorySource"];
};

/**
 * Classify a spend row. Savings first (an investment debit is not a "want"),
 * then the known-merchant table, then the pattern lists.
 *
 * The residual is Uncategorised, NOT Wants. Defaulting the residual into
 * Wants meant every merchant the table had never seen silently inflated the
 * ratio the 30% rule fires on — the rule was policing the parser's ignorance
 * as much as the student's spending.
 */
export function classify(merchant: string): Classification {
  const m = merchant.toLowerCase();
  if (SAVINGS_PATTERNS.some((re) => re.test(m))) {
    return { category: "Savings", source: "rule" };
  }

  const tag = knownTagFor(merchant);
  if (tag === "Invest") return { category: "Savings", source: "rule" };
  if (tag === "Sub" || (tag && NEEDS_TAGS.has(tag))) {
    return { category: "Needs", source: "rule" };
  }

  if (NEEDS_PATTERNS.some((re) => re.test(m))) {
    return { category: "Needs", source: "rule" };
  }
  if (WANTS_PATTERNS.some((re) => re.test(m))) {
    return { category: "Wants", source: "rule" };
  }
  // A merchant the table knows and files as discretionary.
  if (tag === "Food" || tag === "Fun" || tag === "Shopping") {
    return { category: "Wants", source: "rule" };
  }

  return { category: "Uncategorised", source: "none" };
}

/* ------------------------------------------------------ column resolution */

type AmountPlan =
  | { shape: "signed"; amount: number }
  | { shape: "debit-credit"; debit: number; credit: number }
  | { shape: "typed"; amount: number; type: number };

/**
 * Pick the amount shape.
 *
 * The three shapes are tried in the order given by the spec, with one
 * necessary refinement: shapes (a) and (c) both require an amount column, so
 * the only thing that can distinguish them is whether a Dr/Cr type column is
 * also present. When it is, (c) wins — otherwise (c) would be unreachable and
 * the type column would be silently ignored, which is the bug that makes
 * every debit on such a file look like income.
 */
function resolveAmountColumns(headers: string[]): {
  plan: AmountPlan | null;
  columns: Omit<BoundColumns, "date" | "merchant">;
} {
  const idx = (key: string | null) => (key === null ? -1 : headers.indexOf(key));

  const signedKey = findKey(headers, SIGNED_KEYS);
  const typeKey = findKey(headers, TYPE_KEYS);

  // "Dr" and "Cr" are aliases for the Debit and Credit columns, but they are
  // also substrings of a "Dr/Cr" type header. Without this guard a type
  // column gets bound as the Debit column and every amount reads as an outflow
  // of whatever the word "Dr" parses to, which is nothing.
  const notType = (key: string | null) => (key && key === typeKey ? null : key);
  const debitKey = notType(findKey(headers, DEBIT_KEYS));
  const creditKey = notType(findKey(headers, CREDIT_KEYS));

  if (signedKey && typeKey) {
    return {
      plan: { shape: "typed", amount: idx(signedKey), type: idx(typeKey) },
      columns: { amount: signedKey, type: typeKey },
    };
  }
  if (debitKey || creditKey) {
    return {
      plan: {
        shape: "debit-credit",
        debit: idx(debitKey),
        credit: idx(creditKey),
      },
      columns: {
        ...(debitKey ? { debit: debitKey } : {}),
        ...(creditKey ? { credit: creditKey } : {}),
      },
    };
  }
  if (signedKey) {
    return {
      plan: { shape: "signed", amount: idx(signedKey) },
      columns: { amount: signedKey },
    };
  }
  return { plan: null, columns: {} };
}

/** A Dr/Cr type cell to a sign. Unrecognised text reads as a debit. */
function signFromType(raw: string): -1 | 1 | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (/^(cr|credit|c|deposit|in|income)\b/.test(t)) return 1;
  if (/^(dr|debit|d|withdrawal|out|w)\b/.test(t)) return -1;
  return null;
}

/* ------------------------------------------------------------ the parser */

type RawRow = { line: number; raw: string; date: string; merchant: string; net: number };

/** A result carrying only a file-level error, for callers that cannot parse. */
export function fileError(message: string): ParseResult {
  return emptyResult([message]);
}

function emptyResult(errors: string[], skipped = 0): ParseResult {
  return {
    transactions: [],
    skipped,
    skippedRows: [],
    errors,
    columns: { date: "", merchant: "" },
    shape: "none",
    magnitudesOnly: false,
    income: 0,
    spend: 0,
    allowanceSuggestion: null,
  };
}

export function parseStatement(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return emptyResult(["File appears empty, or has a header with no rows."]);
  }

  const headers = splitLine(lines[0]);
  const dateKey = findKey(headers, DATE_KEYS);
  const nameKey = findKey(headers, NAME_KEYS);
  const { plan, columns: amountColumns } = resolveAmountColumns(headers);

  if (!dateKey || !nameKey || !plan) {
    const missing = [
      !dateKey && "date",
      !nameKey && "description/merchant",
      !plan && "amount (or a Debit/Credit pair)",
    ].filter(Boolean);
    return emptyResult(
      [`Could not find a ${missing.join(", ")} column. Found: ${headers.join(", ")}`],
      lines.length - 1,
    );
  }

  const di = headers.indexOf(dateKey);
  const ni = headers.indexOf(nameKey);

  const rows: RawRow[] = [];
  const skippedRows: SkippedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const cells = splitLine(raw);
    const lineNo = i + 1;
    const merchant = (cells[ni] ?? "").replace(/\s+/g, " ").trim();
    const narration = merchant || raw;

    const skip = (reason: string) =>
      skippedRows.push({ row: lineNo, narration, reason, raw });

    const date = normaliseDate(cells[di] ?? "");
    if (!date) {
      skip(
        (cells[di] ?? "").trim()
          ? `unrecognised date format in "${dateKey}": ${cells[di]}`
          : `no date in "${dateKey}"`,
      );
      continue;
    }
    if (!merchant) {
      skip(`no description in "${nameKey}"`);
      continue;
    }

    let net: number | null = null;

    if (plan.shape === "debit-credit") {
      // Either cell alone is enough. An empty cell is zero, not unreadable —
      // a credit-only row has a blank debit and is perfectly valid.
      const debitRaw = plan.debit === -1 ? "" : (cells[plan.debit] ?? "");
      const creditRaw = plan.credit === -1 ? "" : (cells[plan.credit] ?? "");
      const debit = magnitude(debitRaw);
      const credit = magnitude(creditRaw);

      if (debit === null && credit === null) {
        const both = [amountColumns.debit, amountColumns.credit]
          .filter(Boolean)
          .join(" or ");
        skip(`no readable amount in ${both}`);
        continue;
      }
      net = (credit ?? 0) - (debit ?? 0);
    } else if (plan.shape === "typed") {
      const amountRaw = cells[plan.amount] ?? "";
      const size = magnitude(amountRaw);
      if (size === null) {
        skip(`no readable amount in "${amountColumns.amount}"`);
        continue;
      }
      const typeRaw = cells[plan.type] ?? "";
      const sign = signFromType(typeRaw);
      if (sign === null) {
        skip(
          typeRaw.trim()
            ? `unrecognised Dr/Cr value in "${amountColumns.type}": ${typeRaw}`
            : `no Dr/Cr value in "${amountColumns.type}"`,
        );
        continue;
      }
      net = size * sign;
    } else {
      const amountRaw = cells[plan.amount] ?? "";
      const parsed = parseAmount(amountRaw);
      if (parsed === null) {
        skip(`no readable amount in "${amountColumns.amount}"`);
        continue;
      }
      net = parsed;
    }

    if (net === 0) {
      skip(
        plan.shape === "debit-credit"
          ? "debit and credit cancel to ₹0"
          : "amount is ₹0",
      );
      continue;
    }

    rows.push({ line: lineNo, raw, date, merchant, net });
  }

  // A single unsigned column is ambiguous: it is either a signed ledger that
  // happens to have no credits this month, or a spend-only export listing
  // magnitudes. Reading every positive as income would turn the second kind
  // of file — which includes our own template — into all income and no spend.
  // So the convention is decided by the file: a signed column is only treated
  // as signed if it actually carries a negative somewhere.
  const magnitudesOnly =
    plan.shape === "signed" && rows.every((r) => r.net > 0);

  const transactions: ParsedTxn[] = rows.map((r, i) => {
    const isIncome = !magnitudesOnly && r.net > 0;
    const amount = Math.round(Math.abs(r.net));
    if (isIncome) {
      return {
        id: i + 1,
        date: r.date,
        merchant: r.merchant,
        amount,
        direction: "in" as const,
        category: "Income" as const,
        categorySource: "rule" as const,
      };
    }
    const { category, source } = classify(r.merchant);
    return {
      id: i + 1,
      date: r.date,
      merchant: r.merchant,
      amount,
      direction: "out" as const,
      category,
      categorySource: source,
    };
  });

  transactions.sort((a, b) => (a.date < b.date ? 1 : -1));

  const income = transactions
    .filter((t) => t.direction === "in")
    .reduce((s, t) => s + t.amount, 0);
  const spend = transactions
    .filter((t) => t.direction === "out")
    .reduce((s, t) => s + t.amount, 0);

  return {
    transactions,
    skipped: skippedRows.length,
    skippedRows,
    errors: [],
    columns: { date: dateKey, merchant: nameKey, ...amountColumns },
    shape: plan.shape,
    magnitudesOnly,
    income,
    spend,
    allowanceSuggestion: detectAllowance(transactions),
  };
}

/* ------------------------------------------------- allowance detection */

/** Share of monthly income a credit must reach to be worth suggesting. */
export const ALLOWANCE_SHARE = 0.5;

/**
 * Find the recurring credit that looks like the student's monthly allowance.
 *
 * Groups income by exact amount. A group qualifies as recurring if it lands
 * in two or more distinct months; a single-month statement cannot show
 * recurrence, so there one credit is allowed to qualify on its own. The
 * winner is the largest qualifying credit worth at least ALLOWANCE_SHARE of
 * average monthly income.
 *
 * This only ever produces a SUGGESTION. The profile is never written from
 * here — the student has to accept it.
 */
export function detectAllowance(
  transactions: ParsedTxn[],
): AllowanceSuggestion | null {
  const credits = transactions.filter((t) => t.direction === "in");
  if (!credits.length) return null;

  const totalIncome = credits.reduce((s, t) => s + t.amount, 0);
  const months = new Set(credits.map((t) => t.date.slice(0, 7)));
  const monthlyIncome = totalIncome / Math.max(1, months.size);
  if (monthlyIncome <= 0) return null;

  const groups = new Map<number, { months: Set<string>; dates: string[] }>();
  for (const t of credits) {
    const g = groups.get(t.amount) ?? { months: new Set<string>(), dates: [] };
    g.months.add(t.date.slice(0, 7));
    g.dates.push(t.date);
    groups.set(t.amount, g);
  }

  let best: AllowanceSuggestion | null = null;
  for (const [amount, g] of groups) {
    const recurring = g.months.size >= 2 || months.size === 1;
    if (!recurring) continue;
    const share = amount / monthlyIncome;
    if (share < ALLOWANCE_SHARE) continue;
    if (!best || amount > best.amount) {
      best = {
        amount,
        date: g.dates.sort()[g.dates.length - 1],
        occurrences: g.dates.length,
        share,
      };
    }
  }
  return best;
}

/* ------------------------------------------------------- skipped-row CSV */

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Serialise the skip report so it can be downloaded and fixed offline. */
export function skippedToCsv(rows: SkippedRow[]): string {
  const head = "Row,Narration,Reason,Original line";
  const body = rows.map((r) =>
    [r.row, r.narration, r.reason, r.raw].map(csvCell).join(","),
  );
  return [head, ...body].join("\n") + "\n";
}

/** Downloadable template so the expected shape is never a guess. */
// design-lint-allow: mock-data — a blank template the student downloads and
// fills in. It is never rendered as their data, and §30 requires it: without
// a worked example the accepted column shapes are a guessing game.
export const SAMPLE_CSV = `Date,Description,Debit,Credit
2026-08-01,Monthly Allowance from Parents,,12500
2026-08-02,Hostel Mess Fee,3000,
2026-08-03,Swiggy,340,
2026-08-05,Metro Card Topup,300,
2026-08-07,SIP - Index Fund,1500,
2026-08-09,Cafe Coffee Day,220,
2026-08-12,Myntra,1250,
2026-08-15,Apollo Pharmacy,410,
2026-08-18,Zomato,380,
2026-08-21,Spotify Premium,119,
2026-08-24,Xerox & Stationery,90,
`;
