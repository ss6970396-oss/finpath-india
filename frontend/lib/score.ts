/**
 * What is driving the health score — the one line under the dial.
 *
 * Pure, and derived ONLY from `healthScore()`'s own output: it does not
 * re-score anything, so it cannot disagree with the number it explains.
 * The four parts and their maximums are the ones `healthScore` documents
 * (lib/finance.ts): savings 40, wants 30, needs 15, buffer 15.
 *
 * The driver is the part with the most points MISSING from its maximum —
 * the biggest single reason the score is not 100. Ties go to the part a
 * planner would look at first (savings, then wants, needs, buffer), which
 * is also the order healthScore weights them. A perfect score has no
 * driver, and returns null rather than inventing one.
 */

import type { Health } from "./finance";

export type ScorePart = keyof Health["parts"];

/** The maximum each part can earn. Mirrors healthScore's weights. */
export const PART_MAX: Record<ScorePart, number> = {
  savings: 40,
  wants: 30,
  needs: 15,
  buffer: 15,
};

/** Tie-break order, and the order parts are listed in. */
export const PART_ORDER: readonly ScorePart[] = ["savings", "wants", "needs", "buffer"];

/** How each part is named to a student. */
export const PART_LABEL: Record<ScorePart, string> = {
  savings: "Savings rate",
  wants: "Discretionary spending",
  needs: "Essentials",
  buffer: "Unspent buffer",
};

export type ScoreDriver = {
  part: ScorePart;
  earned: number;
  max: number;
  /** Points short of the maximum. Always > 0. */
  missing: number;
};

export function scoreDriver(health: Health): ScoreDriver | null {
  let best: ScoreDriver | null = null;
  for (const part of PART_ORDER) {
    const max = PART_MAX[part];
    // Clamp: a part can never earn below 0 or above its maximum, whatever
    // the rounding in healthScore did.
    const earned = Math.max(0, Math.min(max, health.parts[part]));
    const missing = max - earned;
    if (missing > 0 && (best === null || missing > best.missing)) {
      best = { part, earned, max, missing };
    }
  }
  return best;
}
