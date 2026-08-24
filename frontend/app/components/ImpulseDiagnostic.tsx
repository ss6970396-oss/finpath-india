"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { lumpSumFutureValue, multiple, equivalents, REFERENCE } from "@/lib/finance";
import { inr, inrCompact } from "@/lib/format";
import { Card, Figure, Label, Pill } from "./ui";

const RATE = 0.12; // mirrors SIP_ANNUAL_RATE in backend/nudge.py
const YEARS = 10;
const PRESETS = [1500, 3500, 8000, 15000];

export default function ImpulseDiagnostic() {
  const [amount, setAmount] = useState(3500);
  const [mode, setMode] = useState<"buy" | "invest">("invest");

  const { future, mult, eq } = useMemo(() => {
    const future = lumpSumFutureValue(amount, YEARS, RATE);
    return {
      future,
      mult: multiple(amount, future),
      eq: equivalents(amount),
    };
  }, [amount]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3.5">
        <div>
          <Label>Instant impulse-buy diagnostic</Label>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            What one purchase costs you in {YEARS} years.
          </p>
        </div>
        <Pill tone="positive">{(RATE * 100).toFixed(0)}% CAGR index ETF</Pill>
      </div>

      <div className="px-5 py-5">
        <label htmlFor="impulse" className="block">
          <Label>Purchase amount</Label>
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-md border border-rule bg-surface px-3 focus-within:border-accent">
          <span className="figure text-lg text-ink-muted">₹</span>
          <input
            id="impulse"
            type="number"
            min={0}
            step={100}
            value={amount}
            onChange={(e) =>
              setAmount(Math.max(0, Math.min(10_00_000, Number(e.target.value) || 0)))
            }
            className="figure w-full bg-transparent py-2.5 text-lg font-medium text-ink outline-none"
          />
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              aria-pressed={amount === p}
              className={`figure rounded-md border px-2.5 py-1 text-[12px] transition ${
                amount === p
                  ? "border-rule bg-accent-weak text-accent"
                  : "border-rule bg-surface text-ink-muted hover:border-rule hover:text-ink"
              }`}
            >
              {inr(p)}
            </button>
          ))}
        </div>

        {/* Buy now vs invest now */}
        <div
          role="group"
          aria-label="Comparison mode"
          className="mt-5 grid grid-cols-2 gap-2"
        >
          <button
            onClick={() => setMode("buy")}
            aria-pressed={mode === "buy"}
            className={`rounded-md border px-3 py-2.5 text-left transition ${
              mode === "buy"
                ? "border-warn/40 bg-warn-weak"
                : "border-rule bg-surface hover:border-rule"
            }`}
          >
            <span className="block text-[12px] font-medium text-ink">
              Buy now
            </span>
            <span className="figure mt-0.5 block text-[13px] text-ink-muted">
              {inr(amount)} spent
            </span>
          </button>
          <button
            onClick={() => setMode("invest")}
            aria-pressed={mode === "invest"}
            className={`rounded-md border px-3 py-2.5 text-left transition ${
              mode === "invest"
                ? "border-rule bg-accent-weak"
                : "border-rule bg-surface hover:border-rule"
            }`}
          >
            <span className="block text-[12px] font-medium text-ink">
              Invest now, buy later
            </span>
            <span className="figure mt-0.5 block text-[13px] text-ink-muted">
              {mult.toFixed(1)}x in {YEARS}y
            </span>
          </button>
        </div>

        <div className="mt-5 rounded-md border border-rule bg-surface p-4">
          {mode === "invest" ? (
            <>
              <Label>Value in {YEARS} years at {(RATE * 100).toFixed(0)}% CAGR</Label>
              <p className="figure mt-1 text-3xl font-semibold tracking-tight text-ink">
                {inr(future)}
              </p>
              <p className="mt-2 flex items-start gap-1.5 text-[13px] leading-relaxed text-ink-muted">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                The same {inr(amount)} compounds to{" "}
                <Figure className="text-ink">{mult.toFixed(1)}x</Figure> — enough
                to buy it {Math.floor(mult)} times over.
              </p>
            </>
          ) : (
            <>
              <Label>Opportunity cost of buying today</Label>
              <p className="figure mt-1 text-3xl font-semibold tracking-tight text-warn">
                −{inr(future - amount)}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                That is the compounding you forgo over {YEARS} years. The
                purchase is not wrong; the cost is simply invisible without
                this figure.
              </p>
            </>
          )}
        </div>

        <div className="mt-4">
          <Label>Indicative real-asset equivalents</Label>
          <div className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule">
            {eq.map((e) => (
              <div key={e.id} className="bg-surface px-3 py-2.5">
                <p className="figure text-sm font-medium text-ink">
                  {e.value.toFixed(e.digits)}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-ink-muted">
                  {e.unit} · {e.label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-muted">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Static reference prices, not live market data — gold at{" "}
            <Figure>{inrCompact(REFERENCE.goldPerGram)}</Figure>/g, index unit at{" "}
            <Figure>{inrCompact(REFERENCE.niftyIndexUnit)}</Figure>. Compounding
            at a fixed rate is illustrative; markets do not deliver constant
            returns.
          </p>
        </div>
      </div>
    </Card>
  );
}
