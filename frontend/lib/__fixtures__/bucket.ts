/**
 * Bucket aggregation used by the golden 50/30/20 tests.
 *
 * This mirrors the reducer currently written inline inside
 * app/providers/FinPathProvider.tsx: credits are income and are excluded from
 * every spend bucket (and therefore from the denominator the 30% Wants rule
 * measures against), and Uncategorised is carried as a real fourth bucket.
 *
 * It lives here rather than in lib/ because today there is no production
 * module to import — the logic exists only in the provider. Extracting it into
 * lib/finance.ts is an audit action item; when that happens this file should be
 * deleted and the tests re-pointed at the real export. The frozen expectations
 * in golden-503020.json stay valid either way, which is the point of freezing
 * them before the move.
 */

import type { ParsedTxn } from "../csv";

export type BucketTotals = {
  Needs: number;
  Wants: number;
  Savings: number;
  Uncategorised: number;
};

export type Aggregated = {
  totals: BucketTotals;
  /** Credits. Money in is not spend. */
  income: number;
  /** Sum of the four spend buckets. */
  spend: number;
};

export function bucketTotals(transactions: ParsedTxn[]): Aggregated {
  const totals: BucketTotals = {
    Needs: 0,
    Wants: 0,
    Savings: 0,
    Uncategorised: 0,
  };
  let income = 0;

  for (const t of transactions) {
    if (t.direction === "in") {
      income += t.amount;
      continue;
    }
    totals[t.category as keyof BucketTotals] += t.amount;
  }

  const spend =
    totals.Needs + totals.Wants + totals.Savings + totals.Uncategorised;
  return { totals, income, spend };
}
