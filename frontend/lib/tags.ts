/**
 * Presentation-layer enrichment for the /api/spending transaction feed.
 *
 * The backend (backend/nudge.py) classifies each merchant only as
 * Needs / Wants / Savings. The finer tags and the impulse flag below are
 * DERIVED HERE from the merchant name — they are display heuristics, not
 * server truth. If tagging ever needs to drive a rule or a stored value,
 * move it into nudge.py's MERCHANTS table instead of extending this file.
 */

export type Tag =
  | "Food"
  | "Sub"
  | "Books"
  | "Transit"
  | "Shopping"
  | "Fun"
  | "Health"
  | "Home"
  | "Invest";

const BY_MERCHANT: Record<string, Tag> = {
  // Needs
  "Hostel Mess Fee": "Food",
  "Mobile Recharge": "Sub",
  "Apollo Pharmacy": "Health",
  "Metro Card Topup": "Transit",
  "Xerox & Stationery": "Books",
  "Local Kirana": "Food",
  Laundry: "Home",
  // Wants
  Swiggy: "Food",
  Zomato: "Food",
  BookMyShow: "Fun",
  "Blinkit — Snacks": "Food",
  "Cafe Coffee Day": "Food",
  Myntra: "Shopping",
  "Steam Games": "Fun",
  "Spotify Premium": "Sub",
  // Savings
  "SIP — Index Fund": "Invest",
  "RD Deposit": "Invest",
};

/** Recurring commitments — deliberate, so never flagged as impulse. */
const SUBSCRIPTIONS = new Set(["Spotify Premium", "Mobile Recharge"]);

/** Discretionary categories where a purchase is typically unplanned. */
const IMPULSE_TAGS: ReadonlySet<Tag> = new Set<Tag>([
  "Food",
  "Fun",
  "Shopping",
]);

export function tagFor(merchant: string): Tag {
  return BY_MERCHANT[merchant] ?? "Shopping";
}

/**
 * The same lookup WITHOUT the "Shopping" fallback.
 *
 * `tagFor` exists for display, where guessing a tag is harmless. Category
 * assignment is not display: falling back there is what used to file every
 * unrecognised merchant as Wants and push it into the 30% rule. Callers that
 * decide a category must use this and treat null as "not known", not as a
 * category of its own.
 */
export function knownTagFor(merchant: string): Tag | null {
  return BY_MERCHANT[merchant] ?? null;
}

/**
 * Heuristic: a Wants-category purchase in a discretionary tag that isn't a
 * standing subscription. Intentionally conservative — it is a prompt to look,
 * never an accusation.
 */
export function isImpulse(merchant: string, category: string): boolean {
  if (category !== "Wants") return false;
  if (SUBSCRIPTIONS.has(merchant)) return false;
  return IMPULSE_TAGS.has(tagFor(merchant));
}
