/**
 * Client-side mirror of the opportunity-cost model in backend/nudge.py.
 *
 * The What-If slider has to recompute on every drag, so a round trip per tick
 * is out. To stop the two implementations drifting, the rate and the horizon
 * are NOT written down here — they arrive from /api/spending as
 * `projection_params`, whose single source of truth is nudge.py.
 */

export type ProjectionParams = {
  annual_rate: number;
  years: number;
  wants_threshold: number;
};

export type ProjectionPoint = { year: number; value: number };

/** Mirrors sip_future_value() in backend/nudge.py. */
export function sipFutureValue(
  monthly: number,
  years: number,
  annualRate: number,
): number {
  const r = annualRate / 12;
  const n = years * 12;
  if (!n || !monthly) return 0;
  return Math.round(monthly * (((1 + r) ** n - 1) / r) * (1 + r));
}

/** Mirrors build_projection() in backend/nudge.py. */
export function buildProjection(
  monthly: number,
  params: ProjectionParams,
): ProjectionPoint[] {
  return Array.from({ length: params.years + 1 }, (_, year) => ({
    year,
    value: sipFutureValue(monthly, year, params.annual_rate),
  }));
}
