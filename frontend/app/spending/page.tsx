"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Filter, Gauge, RefreshCw, TrendingDown, TriangleAlert, Wallet,
  Zap, CircleCheck,
} from "lucide-react";
import { useFinPath } from "../providers/FinPathProvider";
import { Card, CardHead, Figure, Label, Pill, Button, Meter, Empty } from "../components/ui";
import StatementUpload from "../components/StatementUpload";
import { RULE, variance, guiltFree, lumpSumFutureValue, type Bucket } from "@/lib/finance";
import { tagFor, isImpulse } from "@/lib/tags";
import { inr, inrCompact, pct, shortDate } from "@/lib/format";

const BUCKETS: Bucket[] = ["Needs", "Wants", "Savings"];
const RULE_OF: Record<Bucket, number> = {
  Needs: RULE.needs,
  Wants: RULE.wants,
  Savings: RULE.savings,
};

type CatFilter = "All" | Bucket;

export default function SpendingEngine() {
  const {
    profile, data, loading, error, reload, totals, transactions, ratio, health, uploaded,
  } = useFinPath();
  const [filter, setFilter] = useState<CatFilter>("All");
  const [leaksOnly, setLeaksOnly] = useState(false);

  // Memoised: a fresh fallback object each render would invalidate every
  // downstream useMemo that depends on it.
  const params = useMemo(
    () =>
      data?.projection_params ?? {
        annual_rate: 0.12,
        years: 10,
        wants_threshold: 0.3,
      },
    [data],
  );

  const vari = useMemo(() => variance(ratio), [ratio]);
  const gf = useMemo(
    () => guiltFree(totals, profile.allowance),
    [totals, profile.allowance],
  );

  // High-frequency micro-leakage: a merchant seen 3+ times, small ticket.
  const leakMerchants = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of transactions) {
      counts.set(t.merchant, (counts.get(t.merchant) ?? 0) + 1);
    }
    return new Set(
      [...counts.entries()].filter(([, n]) => n >= 3).map(([m]) => m),
    );
  }, [transactions]);

  const rows = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== "All" && t.category !== filter) return false;
      if (leaksOnly && !leakMerchants.has(t.merchant)) return false;
      return true;
    });
  }, [transactions, filter, leaksOnly, leakMerchants]);

  const rowsFutureValue = useMemo(
    () =>
      rows.reduce(
        (s, t) => s + lumpSumFutureValue(t.amount, params.years, params.annual_rate),
        0,
      ),
    [rows, params],
  );

  const spent = totals.Needs + totals.Wants + totals.Savings;

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-16">
        <p className="text-[13px] text-meta">Running diagnosis…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Diagnose · Spending Engine</Label>
          <h1 className="mt-1.5 font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight tracking-tight text-ink">
            My Spending
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-meta">
            Every ratio below is a share of your{" "}
            <Figure className="text-ink">{inr(profile.allowance)}</Figure>{" "}
            monthly allowance — the same denominator the rule engine uses when
            it decides whether to fire.
          </p>
        </div>
        <Button variant="secondary" onClick={reload}>
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate feed
        </Button>
      </header>

      {error && (
        <div className="mt-5 rounded-md border border-rust/30 bg-rust-tint px-4 py-3">
          <p className="flex items-center gap-2 text-[13px] font-medium text-rust">
            <TriangleAlert className="h-4 w-4" />
            {error}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-rust">
            Start it with <span className="figure">fastapi dev main.py</span> in{" "}
            <span className="figure">backend/</span>, or upload a CSV statement
            below to work entirely offline.
          </p>
        </div>
      )}

      {/* SCORE + BUCKETS */}
      <section className="mt-7 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-forest-ink" />
            <Label>Financial health score</Label>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <Figure className="text-6xl font-semibold leading-none tracking-tight text-ink">
              {health.score}
            </Figure>
            <span className="pb-1.5">
              <Figure className="text-lg text-meta">/100</Figure>
              <Pill
                className="ml-2"
                tone={
                  health.score >= 60 ? "sage" : health.score >= 40 ? "ochre" : "rust"
                }
              >
                {health.band}
              </Pill>
            </span>
          </div>

          <div className="mt-4">
            <Meter
              value={health.score / 100}
              tone={health.score >= 60 ? "sage" : health.score >= 40 ? "ochre" : "rust"}
            />
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-4">
            {[
              ["Savings rate", health.parts.savings, 40],
              ["Wants control", health.parts.wants, 30],
              ["Needs control", health.parts.needs, 15],
              ["Unspent buffer", health.parts.buffer, 15],
            ].map(([label, got, max]) => (
              <div key={String(label)} className="flex items-center gap-3">
                <dt className="w-28 shrink-0 text-[12px] text-meta">{label}</dt>
                <dd className="flex-1">
                  <Meter value={(got as number) / (max as number)} />
                </dd>
                <dd className="figure w-12 shrink-0 text-right text-[12px] text-ink">
                  {got}/{max}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          {BUCKETS.map((b) => {
            const share = ratio[b];
            const target = RULE_OF[b];
            const dev = vari[b];
            const isFloor = b === "Savings";
            const bad = isFloor ? dev < -0.005 : dev > 0.005;
            const tone = bad ? (isFloor ? "ochre" : "rust") : "sage";

            return (
              <Card key={b} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <Label>{b}</Label>
                  <Pill tone={tone}>
                    {bad ? (
                      <TriangleAlert className="h-3 w-3" />
                    ) : (
                      <CircleCheck className="h-3 w-3" />
                    )}
                    {bad ? (isFloor ? "Below target" : "Over target") : "On target"}
                  </Pill>
                </div>

                <Figure className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                  {inr(totals[b] ?? 0)}
                </Figure>

                <div className="mt-1 flex items-baseline gap-1.5">
                  <Figure className="text-sm text-ink-2">{pct(share, 1)}</Figure>
                  <span className="text-[12px] text-meta">
                    of allowance · target {pct(target)}
                  </span>
                </div>

                <div className="mt-4">
                  <Meter value={share} target={target} tone={tone} />
                </div>

                <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-meta">
                  {dev >= 0 ? (
                    <ArrowRight className="h-3 w-3 rotate-[-45deg]" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <Figure className={bad ? (isFloor ? "text-ochre-ink" : "text-rust") : "text-forest-ink"}>
                    {dev >= 0 ? "+" : ""}
                    {pct(dev, 1)}
                  </Figure>
                  variance to target
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="mt-3 text-[11px] leading-relaxed text-meta">
        Variance is measured against the 50/30/20 target, not against a previous
        month. The API generates a fresh single month on every request and keeps
        no history, so a month-on-month delta would be noise presented as a
        trend.
      </p>

      {/* GUILT-FREE + UPLOAD */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead
            title="Guilt-free spending allowance"
            sub="What is genuinely free to burn once fixed costs and the savings target are covered."
            right={<Wallet className="h-4 w-4 shrink-0 text-meta" />}
          />
          <div className="px-5 py-5">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
              {[
                ["Allowance", inr(profile.allowance), "text-ink"],
                ["Less fixed needs", "−" + inr(gf.fixed), "text-meta"],
                ["Less savings target", "−" + inr(gf.investmentTarget), "text-meta"],
                ["Safe to spend", inr(gf.safeToSpend), "text-ink"],
              ].map(([k, v, cls]) => (
                <div key={k} className="bg-surface px-3.5 py-3">
                  <Label>{k}</Label>
                  <Figure className={`mt-0.5 block text-sm font-medium ${cls}`}>
                    {v}
                  </Figure>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-md border border-line bg-surface-2 p-4">
              <Label>Remaining this month</Label>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <Figure
                  className={`text-3xl font-semibold tracking-tight ${
                    gf.remaining > 0 ? "text-forest-ink" : "text-rust"
                  }`}
                >
                  {inr(gf.remaining)}
                </Figure>
                <span className="pb-1 text-[12px] text-meta">
                  ≈ <Figure className="text-ink">{inr(gf.perDay)}</Figure>/day
                  for 30 days
                </span>
              </div>
              <div className="mt-3">
                <Meter
                  value={
                    gf.safeToSpend > 0
                      ? gf.alreadySpentOnWants / gf.safeToSpend
                      : 1
                  }
                  tone={gf.remaining > 0 ? "sage" : "rust"}
                />
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-meta">
                <Figure className="text-ink">{inr(gf.alreadySpentOnWants)}</Figure>{" "}
                of discretionary spend already recorded against a{" "}
                <Figure className="text-ink">{inr(gf.safeToSpend)}</Figure>{" "}
                envelope.
              </p>
            </div>
          </div>
        </Card>

        <StatementUpload />
      </section>

      {/* LEDGER */}
      <section className="mt-6">
        <Card>
          <CardHead
            title="Transaction ledger"
            sub={`${rows.length} of ${transactions.length} rows · future value at ${pct(params.annual_rate)} over ${params.years} years`}
            right={
              <div className="flex flex-wrap items-center gap-1.5">
                {(["All", ...BUCKETS] as CatFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`rounded-md border px-2.5 py-1 text-[12px] transition ${
                      filter === f
                        ? "border-sage-line bg-sage text-sage-ink"
                        : "border-line bg-surface text-meta hover:text-ink"
                    }`}
                  >
                    {f}
                  </button>
                ))}
                <button
                  onClick={() => setLeaksOnly((v) => !v)}
                  aria-pressed={leaksOnly}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition ${
                    leaksOnly
                      ? "border-ochre/40 bg-ochre-tint text-ochre-ink"
                      : "border-line bg-surface text-meta hover:text-ink"
                  }`}
                >
                  <Filter className="h-3 w-3" />
                  Micro-leakage
                </button>
              </div>
            }
          />

          {rows.length === 0 ? (
            <Empty
              icon={<Filter className="h-4 w-4" />}
              title="No rows match this filter"
              body="Clear the category or micro-leakage filter to see the full ledger."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-sage">
                    {["Date", "Merchant", "Category", "Amount", `${params.years}-yr future value`, "Classification"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-sage-ink ${
                            i >= 3 && i <= 4 ? "text-right" : ""
                          }`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => {
                    const fv = lumpSumFutureValue(
                      t.amount,
                      params.years,
                      params.annual_rate,
                    );
                    const impulse = isImpulse(t.merchant, t.category);
                    const leak = leakMerchants.has(t.merchant);
                    return (
                      <tr
                        key={`${t.id}-${t.merchant}`}
                        className="border-b border-line last:border-0 hover:bg-surface-2"
                      >
                        <td className="figure px-5 py-3 text-[13px] text-meta">
                          {shortDate(t.date)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[13px] font-medium text-ink">
                            {t.merchant}
                          </span>
                          <span className="mt-1 flex flex-wrap gap-1.5">
                            <Pill>{tagFor(t.merchant)}</Pill>
                            {impulse && (
                              <Pill tone="ochre">
                                <Zap className="h-2.5 w-2.5" />
                                impulse
                              </Pill>
                            )}
                            {leak && <Pill tone="ochre">recurring</Pill>}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <Pill tone={t.category === "Savings" ? "sage" : "neutral"}>
                            {t.category}
                          </Pill>
                        </td>
                        <td className="figure px-5 py-3 text-right text-[13px] font-medium text-ink">
                          {inr(t.amount)}
                        </td>
                        <td className="figure px-5 py-3 text-right text-[13px] text-forest-ink">
                          {inr(fv)}
                        </td>
                        <td className="px-5 py-3 text-[12px] text-meta">
                          {t.category === "Savings"
                            ? "Capital formation"
                            : t.category === "Needs"
                              ? "Essential outgo"
                              : "Discretionary outgo"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line bg-surface-2">
                    <td colSpan={3} className="px-5 py-3 text-[12px] text-meta">
                      {leaksOnly || filter !== "All"
                        ? "Filtered subtotal"
                        : "Ledger total"}
                    </td>
                    <td className="figure px-5 py-3 text-right text-[13px] font-semibold text-ink">
                      {inr(rows.reduce((s, t) => s + t.amount, 0))}
                    </td>
                    <td className="figure px-5 py-3 text-right text-[13px] font-semibold text-forest-ink">
                      {inr(rowsFutureValue)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        <p className="mt-3 text-[11px] leading-relaxed text-meta">
          Future value treats each transaction as a one-off lump sum compounding
          at {pct(params.annual_rate)}. Tags, the impulse flag and the recurring
          flag are derived in the browser from the merchant string — they are
          display heuristics, not regulatory classifications.
          {uploaded && " Ledger sourced from your uploaded statement."}
        </p>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4">
        <div>
          <p className="text-[13px] font-medium text-ink">
            {spent > 0
              ? `${inrCompact(totals.Wants)} of discretionary spend this month.`
              : "No spending recorded yet."}
          </p>
          <p className="mt-0.5 text-[12px] text-meta">
            Take the diagnosis into the simulator to model what redirecting it
            does over time.
          </p>
        </div>
        <Link
          href="/simulator"
          className="inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-on-forest transition hover:bg-forest-hover"
        >
          Open the simulator <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
