"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ArrowRight, CalendarClock, Coffee, ShieldAlert, TrendingUp, Waves,
} from "lucide-react";
import { useFinPath } from "../providers/FinPathProvider";
import { Card, CardHead, Figure, Label, Meter } from "../components/ui";
import {
  flatSeries, stepUpSeries, delayedSeries, lifestyleCreep, runway, SHOCKS,
  HABITS, RULE,
} from "@/lib/finance";
import { sipFutureValue } from "@/lib/sip";
import { inr, inrCompact, pct } from "@/lib/format";

const TOOLTIP = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: "0.375rem",
    fontSize: 12,
    fontFamily: "var(--font-plex-mono)",
  },
  labelStyle: { color: "var(--meta)" },
  itemStyle: { color: "var(--ink)" },
} as const;

export default function Simulator() {
  const { profile, data, totals } = useFinPath();
  const params = data?.projection_params ?? {
    annual_rate: 0.12,
    years: 10,
    wants_threshold: 0.3,
  };

  const excess = data?.monthly_excess ?? 0;
  const [monthly, setMonthly] = useState(excess > 0 ? excess : 1500);
  const [horizon, setHorizon] = useState(20);
  const [stepUp, setStepUp] = useState(0.1);

  const [income, setIncome] = useState(profile.allowance * 12);
  const [investShare, setInvestShare] = useState(0.2);

  const [shockId, setShockId] = useState<string | null>(null);
  const [liquid, setLiquid] = useState(Math.round(profile.allowance * 1.5));

  /* ---------------------------------------------------- step-up + delay */
  const growth = useMemo(() => {
    const flat = flatSeries(monthly, horizon, params.annual_rate);
    const step = stepUpSeries(monthly, horizon, params.annual_rate, stepUp);
    const d1 = delayedSeries(monthly, horizon, params.annual_rate, 1);
    const d3 = delayedSeries(monthly, horizon, params.annual_rate, 3);
    return flat.map((f, i) => ({
      year: f.year,
      flat: f.value,
      step: step[i].value,
      delay1: d1[i].value,
      delay3: d3[i].value,
    }));
  }, [monthly, horizon, stepUp, params.annual_rate]);

  const last = growth[growth.length - 1];

  /* ------------------------------------------------------ lifestyle creep */
  const creep = useMemo(
    () =>
      lifestyleCreep(
        income,
        investShare,
        params.annual_rate,
        profile.age,
      ),
    [income, investShare, params.annual_rate, profile.age],
  );

  const creepCurve = useMemo(() => {
    const shares = [0.1, investShare, 0.4];
    return Array.from({ length: 31 }, (_, y) => {
      const row: Record<string, number> = { year: y };
      shares.forEach((s, i) => {
        row[`s${i}`] = sipFutureValue(
          (income / 12) * s,
          y,
          params.annual_rate,
        );
      });
      row.target = creep.corpusTarget;
      return row;
    });
  }, [income, investShare, params.annual_rate, creep.corpusTarget]);

  /* ---------------------------------------------------------- stress test */
  const shock = SHOCKS.find((s) => s.id === shockId);
  const monthlyFixed = totals.Needs > 0 ? totals.Needs : profile.allowance * RULE.needs;
  const rw = useMemo(
    () => runway(liquid, monthlyFixed, profile.allowance, shock),
    [liquid, monthlyFixed, profile.allowance, shock],
  );

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-8">
      <header>
        <Label>Simulate</Label>
        <h1 className="mt-1.5 font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight tracking-tight text-ink">
          Nudge Simulator
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-meta">
          Four models over the same assumption set:{" "}
          <Figure className="text-ink">{pct(params.annual_rate)}</Figure> nominal
          annual return, contributions at the start of each month. Returns are
          illustrative and constant; real markets are neither.
        </p>
      </header>

      {/* STEP-UP AND COST OF DELAY */}
      <Card className="mt-7">
        <CardHead
          title="Step-up and the cost of delay"
          sub="A flat contribution, the same contribution rising each year, and the permanent gap left by starting late."
          right={
            <div className="flex items-center gap-1.5">
              {[10, 20, 30].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  aria-pressed={horizon === h}
                  className={`figure rounded-md border px-2.5 py-1 text-[12px] transition ${
                    horizon === h
                      ? "border-sage-line bg-sage text-sage-ink"
                      : "border-line bg-surface text-meta hover:text-ink"
                  }`}
                >
                  {h}y
                </button>
              ))}
            </div>
          }
        />

        <div className="grid gap-5 px-5 py-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div>
            <label htmlFor="sim-monthly">
              <Label>Monthly contribution</Label>
            </label>
            <Figure className="mt-1 block text-2xl font-semibold tracking-tight text-ink">
              {inr(monthly)}
            </Figure>
            <input
              id="sim-monthly"
              type="range"
              min={500}
              max={50000}
              step={500}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--forest)]"
            />
            <div className="figure mt-1 flex justify-between text-[11px] text-meta">
              <span>{inr(500)}</span>
              <span>{inr(50000)}</span>
            </div>

            <label htmlFor="sim-step" className="mt-5 block">
              <Label>Annual step-up</Label>
            </label>
            <Figure className="mt-1 block text-lg font-medium text-ink">
              {pct(stepUp)}
            </Figure>
            <input
              id="sim-step"
              type="range"
              min={0}
              max={0.25}
              step={0.01}
              value={stepUp}
              onChange={(e) => setStepUp(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--forest)]"
            />

            <dl className="mt-5 space-y-px overflow-hidden rounded-md border border-line bg-line">
              {[
                ["Flat SIP", last.flat, "text-ink"],
                [`Step-up ${pct(stepUp)}`, last.step, "text-forest-ink"],
                ["Started 1 year late", last.delay1, "text-ochre-ink"],
                ["Started 3 years late", last.delay3, "text-rust"],
              ].map(([k, v, cls]) => (
                <div
                  key={String(k)}
                  className="flex items-baseline justify-between bg-surface px-3.5 py-2.5"
                >
                  <dt className="text-[12px] text-meta">{k}</dt>
                  <dd>
                    <Figure className={`text-[13px] font-medium ${cls}`}>
                      {inrCompact(v as number)}
                    </Figure>
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-3 text-[12px] leading-relaxed text-meta">
              Three years of delay costs{" "}
              <Figure className="text-rust">
                {inrCompact(last.flat - last.delay3)}
              </Figure>{" "}
              at year {horizon} — more than the{" "}
              <Figure className="text-ink">
                {inrCompact(monthly * 36)}
              </Figure>{" "}
              that went uninvested.
            </p>
          </div>

          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tickFormatter={(y) => `${y}y`}
                  tickLine={false}
                  axisLine={{ stroke: "var(--line)" }}
                  stroke="var(--meta)"
                  fontSize={11}
                />
                <YAxis
                  tickFormatter={(v) => inrCompact(v)}
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--meta)"
                  fontSize={11}
                  width={62}
                />
                <Tooltip
                  {...TOOLTIP}
                  formatter={(v, n) => [inr(Number(v)), String(n)]}
                  labelFormatter={(y) => `Year ${y}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "var(--meta)" }}
                  iconType="plainline"
                />
                <Line type="monotone" dataKey="step" name={`Step-up ${pct(stepUp)}`} stroke="var(--forest)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="flat" name="Flat SIP" stroke="var(--ink-2)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="delay1" name="1-year delay" stroke="var(--ochre)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                <Line type="monotone" dataKey="delay3" name="3-year delay" stroke="var(--rust)" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* LIFESTYLE CREEP */}
      <Card className="mt-6">
        <CardHead
          title="Lifestyle creep and financial-independence age"
          sub="As income rises, the split between overhead and automated investing decides when work becomes optional."
          right={<Waves className="h-4 w-4 shrink-0 text-meta" />}
        />

        <div className="grid gap-5 px-5 py-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div>
            <label htmlFor="sim-income">
              <Label>Annual income</Label>
            </label>
            <Figure className="mt-1 block text-2xl font-semibold tracking-tight text-ink">
              {inr(income)}
            </Figure>
            <input
              id="sim-income"
              type="range"
              min={180000}
              max={2500000}
              step={10000}
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--forest)]"
            />
            <div className="figure mt-1 flex justify-between text-[11px] text-meta">
              <span>{inrCompact(180000)}</span>
              <span>{inrCompact(2500000)}</span>
            </div>

            <label htmlFor="sim-share" className="mt-5 block">
              <Label>Routed to investing</Label>
            </label>
            <div className="mt-1 flex items-baseline gap-2">
              <Figure className="text-2xl font-semibold tracking-tight text-forest-ink">
                {pct(investShare)}
              </Figure>
              <span className="text-[12px] text-meta">
                <Figure>{inr(creep.monthlyInvested)}</Figure>/mo
              </span>
            </div>
            <input
              id="sim-share"
              type="range"
              min={0}
              max={0.7}
              step={0.01}
              value={investShare}
              onChange={(e) => setInvestShare(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--forest)]"
            />

            <div className="mt-5 rounded-md border border-line bg-surface-2 p-4">
              <Label>Projected FI age</Label>
              {creep.fiAge !== null ? (
                <>
                  <Figure className="mt-1 block text-4xl font-semibold tracking-tight text-ink">
                    {creep.fiAge}
                  </Figure>
                  <p className="mt-1 text-[12px] text-meta">
                    <Figure className="text-ink">{creep.yearsToFI}</Figure> years
                    from age {profile.age}, reaching a{" "}
                    <Figure className="text-ink">
                      {inrCompact(creep.corpusTarget)}
                    </Figure>{" "}
                    corpus.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-lg font-medium text-rust">
                    Not reached within 60 years
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-meta">
                    At this savings rate, overhead grows the target as fast as
                    the corpus grows toward it. Raise the share routed to
                    investing.
                  </p>
                </>
              )}
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-meta">
              Target corpus is 25x annual overhead, the 4% safe-withdrawal
              convention. Overhead is whatever income is not invested.
            </p>
          </div>

          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={creepCurve} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="creepFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--forest)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--forest)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tickFormatter={(y) => `${y}y`}
                  tickLine={false}
                  axisLine={{ stroke: "var(--line)" }}
                  stroke="var(--meta)"
                  fontSize={11}
                />
                <YAxis
                  tickFormatter={(v) => inrCompact(v)}
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--meta)"
                  fontSize={11}
                  width={62}
                />
                <Tooltip
                  {...TOOLTIP}
                  formatter={(v, n) => [inr(Number(v)), String(n)]}
                  labelFormatter={(y) => `Year ${y}`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />
                <Area type="monotone" dataKey="s1" name={`Your rate ${pct(investShare)}`} stroke="var(--forest)" strokeWidth={2} fill="url(#creepFill)" />
                <Line type="monotone" dataKey="s0" name="10% rate" stroke="var(--ochre)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="s2" name="40% rate" stroke="var(--ink-2)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                <Line type="monotone" dataKey="target" name="FI target corpus" stroke="var(--rust)" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* STRESS TEST + HABITS */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead
            title="Burn-rate stress test"
            sub="How long the liquid buffer covers fixed costs when income stops or a bill lands."
            right={<ShieldAlert className="h-4 w-4 shrink-0 text-meta" />}
          />
          <div className="px-5 py-5">
            <label htmlFor="sim-liquid">
              <Label>Liquid emergency fund</Label>
            </label>
            <Figure className="mt-1 block text-xl font-semibold tracking-tight text-ink">
              {inr(liquid)}
            </Figure>
            <input
              id="sim-liquid"
              type="range"
              min={0}
              max={Math.max(200000, profile.allowance * 12)}
              step={1000}
              value={liquid}
              onChange={(e) => setLiquid(Number(e.target.value))}
              className="mt-2.5 w-full accent-[var(--forest)]"
            />

            <div className="mt-4 grid gap-1.5">
              {SHOCKS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setShockId(shockId === s.id ? null : s.id)}
                  aria-pressed={shockId === s.id}
                  className={`rounded-md border px-3.5 py-2.5 text-left transition ${
                    shockId === s.id
                      ? "border-rust/40 bg-rust-tint"
                      : "border-line bg-surface hover:border-line-strong"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-ink">
                      {s.label}
                    </span>
                    <Figure className="shrink-0 text-[12px] text-meta">
                      {s.oneOff > 0
                        ? "−" + inrCompact(s.oneOff)
                        : `−${s.incomeMonthsLost} mo income`}
                    </Figure>
                  </span>
                  <span className="mt-0.5 block text-[12px] text-meta">
                    {s.detail}
                  </span>
                </button>
              ))}
            </div>

            <div
              className={`mt-4 rounded-md border p-4 ${
                rw.covered
                  ? "border-line bg-surface-2"
                  : "border-rust/30 bg-rust-tint"
              }`}
            >
              <Label>Runway after shock</Label>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <Figure
                  className={`text-4xl font-semibold tracking-tight ${
                    rw.covered ? "text-ink" : "text-rust"
                  }`}
                >
                  {rw.survivedDays === 999 ? "∞" : rw.survivedDays}
                </Figure>
                <span className="pb-1 text-[12px] text-meta">
                  days of fixed costs at{" "}
                  <Figure className="text-ink">{inr(monthlyFixed)}</Figure>/mo
                </span>
              </div>
              <div className="mt-3">
                <Meter
                  value={Math.min(1, rw.survivedDays / 90)}
                  target={1}
                  tone={rw.survivedDays >= 90 ? "sage" : rw.survivedDays >= 30 ? "ochre" : "rust"}
                />
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-meta">
                {rw.covered
                  ? `The marker sits at the 90-day (3-month) benchmark. ${
                      rw.survivedDays >= 90
                        ? "This buffer clears it."
                        : `Short by ${90 - rw.survivedDays} days.`
                    }`
                  : `The buffer is exhausted and ${inr(rw.shortfall)} short. This shock would require borrowing.`}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead
            title="Micro-habit equivalency"
            sub={`Each habit's monthly cost, compounded at ${pct(params.annual_rate)} over ${horizon} years.`}
            right={<Coffee className="h-4 w-4 shrink-0 text-meta" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-sage">
                  {["Habit", "Frequency", "Per month", `In ${horizon} years`].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-sage-ink ${
                          i >= 2 ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {HABITS.map((h) => {
                  const perMonth = h.perOccurrence * h.perMonth;
                  const fv = sipFutureValue(perMonth, horizon, params.annual_rate);
                  return (
                    <tr key={h.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <span className="text-[13px] font-medium text-ink">
                          {h.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-meta">
                          <Figure>{inr(h.perOccurrence)}</Figure> {h.unit}
                        </span>
                      </td>
                      <td className="figure px-5 py-3 text-[13px] text-meta">
                        {h.perMonth}x / mo
                      </td>
                      <td className="figure px-5 py-3 text-right text-[13px] text-ink">
                        {inr(perMonth)}
                      </td>
                      <td className="figure px-5 py-3 text-right text-[13px] font-medium text-forest-ink">
                        {inrCompact(fv)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-surface-2">
                  <td colSpan={2} className="px-5 py-3 text-[12px] text-meta">
                    All five habits together
                  </td>
                  <td className="figure px-5 py-3 text-right text-[13px] font-semibold text-ink">
                    {inr(HABITS.reduce((s, h) => s + h.perOccurrence * h.perMonth, 0))}
                  </td>
                  <td className="figure px-5 py-3 text-right text-[13px] font-semibold text-forest-ink">
                    {inrCompact(
                      sipFutureValue(
                        HABITS.reduce((s, h) => s + h.perOccurrence * h.perMonth, 0),
                        horizon,
                        params.annual_rate,
                      ),
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="px-5 py-3.5 text-[11px] leading-relaxed text-meta">
            Reference frequencies, not your transactions. The point is the order
            of magnitude: small recurring outflows dominate one-off purchases
            over long horizons.
          </p>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4">
        <p className="flex items-center gap-2 text-[13px] text-meta">
          <TrendingUp className="h-4 w-4 text-forest-ink" />
          Turn these projections into a sequenced plan.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/counselor"
            className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-line-strong"
          >
            <CalendarClock className="h-4 w-4" /> Ask the counselor
          </Link>
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-on-forest transition hover:bg-forest-hover"
          >
            Open the roadmap <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
