"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { AlertTriangle, ArrowUpRight, Info } from "lucide-react";
import { buildProjection, type ProjectionParams, type ProjectionPoint } from "@/lib/sip";
import PageHeader from "../components/PageHeader";
import SiteFooter from "../components/SiteFooter";

type Data = {
  allowance: number;
  totals: Record<string, number>;
  spent: number;
  wants_pct: number;
  triggered: boolean;
  monthly_excess: number;
  projection: ProjectionPoint[];
  ten_year_value: number;
  projection_params: ProjectionParams;
  transactions: { id: number; date: string; merchant: string; amount: number; category: string }[];
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const PANEL = "rounded-2xl border border-slate-900 bg-slate-900/30";
const HEADING = "text-2xl font-black uppercase tracking-tight text-slate-100";
const LABEL = "text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500";

export default function Dashboard() {
  const [d, setD] = useState<Data | null>(null);
  const [monthly, setMonthly] = useState(0);

  useEffect(() => {
    fetch("http://localhost:8000/api/spending")
      .then((r) => r.json())
      .then((data: Data) => {
        setD(data);
        setMonthly(data.monthly_excess);
      })
      .catch(() => {});
  }, []);

  // At the default amount the server's own curve is authoritative; the local
  // mirror only runs for hypotheticals the user drags to.
  const projection = useMemo(() => {
    if (!d) return [];
    return monthly === d.monthly_excess
      ? d.projection
      : buildProjection(monthly, d.projection_params);
  }, [monthly, d]);

  if (!d)
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950">
        <p className={LABEL}>Loading your spending…</p>
      </main>
    );

  const pct = (k: string) => Math.round((d.totals[k] / d.spent) * 100);
  const sliderMax = Math.max(2000, Math.ceil((d.monthly_excess * 2.5) / 100) * 100);
  const tenYear = projection[projection.length - 1].value;
  const month = d.transactions.length
    ? new Date(`${d.transactions[0].date}T00:00:00`).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "Last 30 days";

  return (
    <main className="flex min-h-dvh flex-col bg-slate-950">
      <PageHeader
        title="Your Spending"
        subtitle={month}
        active="/dashboard"
        width="max-w-5xl"
      />

      <div className="mx-auto w-full max-w-5xl flex-1 space-y-12 px-8 py-12">
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-900 bg-slate-900/40 px-4 py-3 text-xs text-slate-500">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Simulated UPI data. Production uses the Sahamati Account Aggregator
          consent framework — never SMS scraping.
        </div>

        {/* the figures are the focal point of this screen */}
        <div className="grid gap-5 sm:grid-cols-3">
          {(["Needs", "Wants", "Savings"] as const).map((k) => (
            <div key={k} className={`${PANEL} p-7`}>
              <p className={LABEL}>{k}</p>
              <p className="mt-2.5 text-4xl font-black tabular-nums tracking-tight text-slate-100">
                {inr(d.totals[k])}
              </p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={
                    k === "Wants"
                      ? "h-full bg-amber-400"
                      : k === "Savings"
                        ? "h-full bg-emerald-400"
                        : "h-full bg-slate-600"
                  }
                  style={{ width: `${pct(k)}%` }}
                />
              </div>
              <p className="mt-2.5 text-xs text-slate-500">
                {pct(k)}% of spending
              </p>
            </div>
          ))}
        </div>

        {d.triggered && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-7">
            <div className="flex gap-4">
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-amber-300">
                  Wants are {d.wants_pct}% of your spending
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-100/70">
                  That&apos;s above the 30% guideline. You&apos;re spending{" "}
                  <strong className="font-bold text-amber-200">
                    {inr(d.monthly_excess)}
                  </strong>{" "}
                  more per month than the threshold — not a mistake, just a
                  choice worth seeing clearly.
                </p>
              </div>
            </div>
          </div>
        )}

        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className={HEADING}>The opportunity cost</h2>
              <p className="mt-2 text-sm text-slate-500">
                {inr(monthly)}/month in a SIP at 12% p.a.
              </p>
            </div>
            <div className="text-right">
              <p className={LABEL}>In 10 years</p>
              <p className="mt-1.5 flex items-center gap-1 text-4xl font-black tabular-nums tracking-tight text-emerald-400">
                <ArrowUpRight className="h-7 w-7" />
                {inr(tenYear)}
              </p>
            </div>
          </div>

          <div className={`${PANEL} h-64 p-5`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="year"
                  tickFormatter={(y) => `${y}y`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#64748b"
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#64748b"
                  width={55}
                />
                <Tooltip
                  formatter={(v) => [inr(Number(v)), "Value"]}
                  labelFormatter={(y) => `Year ${y}`}
                  cursor={{ stroke: "#334155" }}
                  contentStyle={{
                    background: "#020617",
                    border: "1px solid #1e293b",
                    borderRadius: "0.75rem",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#g)"
                  animationDuration={1400}
                  isAnimationActive={monthly === d.monthly_excess}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* What-If: drag to see a different monthly amount compound */}
        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className={HEADING}>What if</h2>
              <p className="mt-2 text-sm text-slate-500">
                Drag to invest a different amount every month.
              </p>
            </div>
            {monthly !== d.monthly_excess && (
              <button
                onClick={() => setMonthly(d.monthly_excess)}
                className="rounded-full border border-slate-700 px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
              >
                Reset to {inr(d.monthly_excess)}
              </button>
            )}
          </div>

          <div className={`${PANEL} p-7`}>
            <label htmlFor="whatif" className={LABEL}>
              Monthly investment
            </label>
            <p className="mb-6 mt-2 text-4xl font-black tabular-nums tracking-tight text-slate-100">
              {inr(monthly)}
              <span className="ml-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                / month
              </span>
            </p>
            <input
              id="whatif"
              type="range"
              min={0}
              max={sliderMax}
              step={50}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="w-full accent-emerald-400"
            />
            <div className="mt-2 flex justify-between text-xs tabular-nums text-slate-600">
              <span>₹0</span>
              <span>{inr(sliderMax)}</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className={`${HEADING} mb-6`}>Recent transactions</h2>
          <div className={`${PANEL} divide-y divide-slate-900 overflow-hidden`}>
            {d.transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-7 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {t.merchant}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-slate-600">
                    {t.date}
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <span
                    className={
                      t.category === "Wants"
                        ? "rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300"
                        : t.category === "Savings"
                          ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300"
                          : "rounded-full border border-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                    }
                  >
                    {t.category}
                  </span>
                  <span className="w-20 text-right text-sm font-medium tabular-nums text-slate-200">
                    {inr(t.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
