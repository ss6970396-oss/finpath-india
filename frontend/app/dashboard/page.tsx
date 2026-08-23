"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { TrendingUp, AlertTriangle, ArrowUpRight, Info } from "lucide-react";
import Link from "next/link";
import { buildProjection, type ProjectionParams, type ProjectionPoint } from "@/lib/sip";

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
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading your spending…
      </div>
    );

  const pct = (k: string) => Math.round((d.totals[k] / d.spent) * 100);
  const sliderMax = Math.max(2000, Math.ceil((d.monthly_excess * 2.5) / 100) * 100);
  const tenYear = projection[projection.length - 1].value;

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold tracking-tight text-slate-900">
                FinPath India
              </h1>
              <p className="text-xs text-slate-500">Behavioural Nudge Engine</p>
            </div>
          </Link>
          <Link
            href="/counselor"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Ask the Counselor →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Simulated UPI data. Production uses the Sahamati Account Aggregator
          consent framework — never SMS scraping.
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {(["Needs", "Wants", "Savings"] as const).map((k) => (
            <Card key={k} className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {k}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {inr(d.totals[k])}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={
                    k === "Wants"
                      ? "h-full bg-amber-500"
                      : k === "Savings"
                        ? "h-full bg-emerald-500"
                        : "h-full bg-slate-400"
                  }
                  style={{ width: `${pct(k)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {pct(k)}% of spending
              </p>
            </Card>
          ))}
        </div>

        {d.triggered && (
          <Card className="border-amber-200 bg-amber-50 p-6">
            <div className="flex gap-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">
                  Wants are {d.wants_pct}% of your spending
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  That&apos;s above the 30% guideline. You&apos;re spending{" "}
                  <strong>{inr(d.monthly_excess)}</strong> more per month than
                  the threshold — not a mistake, just a choice worth seeing
                  clearly.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="mb-1 flex items-start justify-between">
            <div>
              <h3 className="font-semibold">The opportunity cost</h3>
              <p className="text-sm text-slate-500">
                {inr(monthly)}/month in a SIP at 12% p.a.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                In 10 years
              </p>
              <p className="flex items-center gap-1 text-2xl font-semibold tabular-nums text-emerald-700">
                <ArrowUpRight className="h-5 w-5" />
                {inr(tenYear)}
              </p>
            </div>
          </div>

          {/* What-If: drag to see a different monthly amount compound */}
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <label
                htmlFor="whatif"
                className="text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                What if you invested
              </label>
              {monthly !== d.monthly_excess && (
                <button
                  onClick={() => setMonthly(d.monthly_excess)}
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Reset to {inr(d.monthly_excess)}
                </button>
              )}
            </div>
            <input
              id="whatif"
              type="range"
              min={0}
              max={sliderMax}
              step={50}
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="mt-1 flex justify-between text-xs tabular-nums text-slate-400">
              <span>₹0</span>
              <span className="font-semibold text-slate-700">
                {inr(monthly)}/month
              </span>
              <span>{inr(sliderMax)}</span>
            </div>
          </div>

          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projection}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="year"
                  tickFormatter={(y) => `${y}y`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#94a3b8"
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#94a3b8"
                  width={55}
                />
                <Tooltip
                  formatter={(v) => [inr(Number(v)), "Value"]}
                  labelFormatter={(y) => `Year ${y}`}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#059669"
                  strokeWidth={2}
                  fill="url(#g)"
                  animationDuration={1400}
                  isAnimationActive={monthly === d.monthly_excess}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b px-6 py-4">
            <h3 className="font-semibold">Recent transactions</h3>
          </div>
          <div className="divide-y">
            {d.transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{t.merchant}</p>
                  <p className="text-xs text-slate-400">{t.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={
                      t.category === "Wants"
                        ? "rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                        : t.category === "Savings"
                          ? "rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                          : "rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                    }
                  >
                    {t.category}
                  </span>
                  <span className="w-20 text-right text-sm tabular-nums">
                    {inr(t.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
