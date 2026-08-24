"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight, CircleCheck, Circle, CreditCard, Landmark, Repeat, TrendingUp,
  Info,
} from "lucide-react";
import { useFinPath } from "../providers/FinPathProvider";
import { Card, CardHead, Figure, Label, Pill, Meter } from "../components/ui";
import { RULE, guiltFree } from "@/lib/finance";
import { inr, pct } from "@/lib/format";

type Stage = {
  id: string;
  n: number;
  title: string;
  goal: string;
  icon: React.ComponentType<{ className?: string }>;
  /** 0-1 completion derived from the live diagnosis. */
  progress: number;
  metric: string;
};

type Task = {
  id: string;
  stage: string;
  label: string;
  how: string;
  /** true when the diagnosis says this gap is currently open */
  flagged: boolean;
};

export default function Roadmap() {
  const { profile, totals, ratio, health, data, done, toggleTask } = useFinPath();

  const params = data?.projection_params ?? {
    annual_rate: 0.12,
    years: 10,
    wants_threshold: 0.3,
  };

  const gf = useMemo(
    () => guiltFree(totals, profile.allowance),
    [totals, profile.allowance],
  );

  // Emergency-fund proxy: cumulative Savings against three months of Needs.
  const monthlyFixed = totals.Needs > 0 ? totals.Needs : profile.allowance * RULE.needs;
  const runwayTarget = monthlyFixed * 3;
  const runwayProgress = runwayTarget > 0 ? Math.min(1, totals.Savings / runwayTarget) : 0;

  const savingsProgress = Math.min(1, ratio.Savings / RULE.savings);
  const wantsUnderControl = ratio.Wants <= params.wants_threshold;

  const stages: Stage[] = [
    {
      id: "debt",
      n: 1,
      title: "Zero high-interest debt",
      goal: "No revolving credit card balance or BNPL instalment outstanding.",
      icon: CreditCard,
      // The feed carries no liability data, so this is self-attested.
      progress: done["debt-cards"] && done["debt-bnpl"] ? 1 : done["debt-cards"] || done["debt-bnpl"] ? 0.5 : 0,
      metric: "Self-attested — the transaction feed carries no liability data",
    },
    {
      id: "runway",
      n: 2,
      title: "Three-month liquid runway",
      goal: `Hold ${inr(runwayTarget)} in a savings account or liquid debt fund.`,
      icon: Landmark,
      progress: runwayProgress,
      metric: `${inr(totals.Savings)} of ${inr(runwayTarget)} accumulated`,
    },
    {
      id: "core",
      n: 3,
      title: "Automated compounding core",
      goal: `Route ${pct(RULE.savings)} of allowance to an index SIP on the day income lands.`,
      icon: Repeat,
      progress: savingsProgress,
      metric: `Savings rate ${pct(ratio.Savings, 1)} against a ${pct(RULE.savings)} target`,
    },
    {
      id: "engine",
      n: 4,
      title: "Inflation-beating wealth engine",
      goal: "Sustain a real return above 7% after inflation, with contributions stepping up annually.",
      icon: TrendingUp,
      progress: savingsProgress >= 1 && wantsUnderControl ? 0.6 : 0,
      metric: "Unlocks once the compounding core is steady",
    },
  ];

  const tasks: Task[] = [
    {
      id: "debt-cards",
      stage: "debt",
      label: "Clear any revolving credit card balance in full",
      how: "Paying only the minimum due keeps the remaining balance accruing at the card's full rate. Clear the statement balance before the due date, every cycle.",
      flagged: true,
    },
    {
      id: "debt-bnpl",
      stage: "debt",
      label: "Close open BNPL instalment plans",
      how: "List every pay-later commitment, then retire the shortest first so the recurring outgo disappears from next month's fixed costs.",
      flagged: true,
    },
    {
      id: "runway-open",
      stage: "runway",
      label: "Open a separate account for the emergency fund",
      how: "Keeping the buffer in the spending account guarantees it gets spent. A separate savings account with no linked card is enough.",
      flagged: runwayProgress < 1,
    },
    {
      id: "runway-fund",
      stage: "runway",
      label: `Build the balance to ${inr(runwayTarget)}`,
      how: `Three months of your current fixed costs of ${inr(monthlyFixed)}. Fund it before increasing SIP size — liquidity precedes returns.`,
      flagged: runwayProgress < 1,
    },
    {
      id: "core-sip",
      stage: "core",
      label: `Automate ${inr(profile.allowance * RULE.savings)} per month into an index SIP`,
      how: "Set the mandate date to the day after income arrives, so investing happens before discretionary spending rather than after it.",
      flagged: savingsProgress < 1,
    },
    {
      id: "core-wants",
      stage: "core",
      label: `Bring Wants back under ${pct(params.wants_threshold)} of allowance`,
      how: wantsUnderControl
        ? "Currently within the guideline. Hold the line as income rises — that is where lifestyle creep enters."
        : `Wants are at ${pct(ratio.Wants, 1)}. Redirecting the excess of ${inr(Math.max(0, totals.Wants - profile.allowance * params.wants_threshold))} per month is the single largest lever available this month.`,
      flagged: !wantsUnderControl,
    },
    {
      id: "engine-stepup",
      stage: "engine",
      label: "Add a 10% annual step-up to the SIP mandate",
      how: "A contribution that rises with income keeps the savings rate constant instead of letting it decay in real terms.",
      flagged: savingsProgress >= 1,
    },
    {
      id: "engine-review",
      stage: "engine",
      label: "Review allocation and costs once a year",
      how: "Check the expense ratio and that the allocation still matches the horizon. Frequent switching costs more than it earns.",
      flagged: savingsProgress >= 1,
    },
  ];

  const openTasks = tasks.filter((t) => t.flagged && !done[t.id]);
  const completed = tasks.filter((t) => done[t.id]).length;

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label>Act · Financial Progression Roadmap</Label>
          <h1 className="mt-1.5 font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight tracking-tight text-ink">
            My Plan
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-meta">
            Four stages, in order. Each one is scored from the same diagnosis
            the Spending Engine runs, so the ladder moves when your ratios do.
          </p>
        </div>
        <Card className="px-5 py-3.5">
          <Label>Checklist</Label>
          <div className="mt-1 flex items-baseline gap-2">
            <Figure className="text-2xl font-semibold tracking-tight text-ink">
              {completed}
            </Figure>
            <Figure className="text-[13px] text-meta">/ {tasks.length}</Figure>
            <Pill tone={openTasks.length === 0 ? "sage" : "ochre"} className="ml-1">
              {openTasks.length === 0
                ? "No open gaps"
                : `${openTasks.length} flagged`}
            </Pill>
          </div>
        </Card>
      </header>

      {/* LADDER */}
      <section className="mt-7 grid gap-4 lg:grid-cols-4">
        {stages.map((s) => {
          const complete = s.progress >= 1;
          return (
            <Card key={s.id} className="flex flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded border ${
                      complete
                        ? "border-forest bg-forest"
                        : "border-line bg-surface-2"
                    }`}
                  >
                    <s.icon
                      className={`h-3.5 w-3.5 ${complete ? "text-on-forest" : "text-meta"}`}
                    />
                  </span>
                  <Label>Stage {s.n}</Label>
                </span>
                {complete && <Pill tone="sage">Complete</Pill>}
              </div>

              <h2 className="mt-3.5 font-display text-lg leading-snug tracking-tight text-ink">
                {s.title}
              </h2>
              <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-meta">
                {s.goal}
              </p>

              <div className="mt-4">
                <div className="mb-1.5 flex items-baseline justify-between">
                  <Label>Progress</Label>
                  <Figure className="text-[12px] text-ink">
                    {pct(s.progress)}
                  </Figure>
                </div>
                <Meter
                  value={s.progress}
                  tone={complete ? "sage" : s.progress > 0 ? "ochre" : "rust"}
                />
                <p className="mt-2 text-[11px] leading-relaxed text-meta">
                  {s.metric}
                </p>
              </div>
            </Card>
          );
        })}
      </section>

      {/* TASKS */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHead
            title="Action checklist"
            sub="Generated from the gaps in your current diagnosis. Flagged items are the ones the numbers say are open."
          />
          <ul className="divide-y divide-line">
            {stages.map((stage) => {
              const stageTasks = tasks.filter((t) => t.stage === stage.id);
              return (
                <li key={stage.id}>
                  <p className="flex items-center gap-2 bg-surface-2 px-5 py-2">
                    <Figure className="text-[11px] text-meta">
                      0{stage.n}
                    </Figure>
                    <span className="text-[12px] font-medium text-ink">
                      {stage.title}
                    </span>
                  </p>
                  <ul>
                    {stageTasks.map((t) => {
                      const checked = !!done[t.id];
                      return (
                        <li key={t.id} className="border-t border-line">
                          <div className="flex gap-3 px-5 py-3.5">
                            <button
                              onClick={() => toggleTask(t.id)}
                              role="checkbox"
                              aria-checked={checked}
                              aria-label={t.label}
                              className="mt-0.5 shrink-0"
                            >
                              {checked ? (
                                <CircleCheck className="h-4 w-4 text-forest-ink" />
                              ) : (
                                <Circle className="h-4 w-4 text-line-strong" />
                              )}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-[13px] font-medium ${
                                    checked
                                      ? "text-meta line-through"
                                      : "text-ink"
                                  }`}
                                >
                                  {t.label}
                                </span>
                                {t.flagged && !checked && (
                                  <Pill tone="ochre">Gap</Pill>
                                )}
                              </div>
                              <p className="mt-1 text-[12px] leading-relaxed text-meta">
                                {t.how}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
          <p className="flex items-start gap-1.5 border-t border-line px-5 py-3.5 text-[11px] leading-relaxed text-meta">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Completion is stored in this browser only. Stage 1 is self-attested
            because the transaction feed carries no liability data — nothing in
            the corpus or the API can confirm a cleared balance.
          </p>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <Label>Current diagnosis</Label>
            <div className="mt-3 flex items-baseline gap-2">
              <Figure className="text-4xl font-semibold tracking-tight text-ink">
                {health.score}
              </Figure>
              <Figure className="text-[13px] text-meta">/100</Figure>
              <Pill
                tone={health.score >= 60 ? "sage" : health.score >= 40 ? "ochre" : "rust"}
                className="ml-1"
              >
                {health.band}
              </Pill>
            </div>
            <dl className="mt-4 space-y-2 border-t border-line pt-3.5">
              {[
                ["Needs", ratio.Needs, RULE.needs],
                ["Wants", ratio.Wants, params.wants_threshold],
                ["Savings", ratio.Savings, RULE.savings],
              ].map(([k, v, t]) => (
                <div key={String(k)} className="flex items-center justify-between gap-3">
                  <dt className="text-[12px] text-meta">{k}</dt>
                  <dd className="flex items-baseline gap-1.5">
                    <Figure className="text-[13px] text-ink">
                      {pct(v as number, 1)}
                    </Figure>
                    <Figure className="text-[11px] text-meta">
                      / {pct(t as number)}
                    </Figure>
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href="/spending"
              className="mt-4 inline-flex items-center gap-1.5 border-t border-line pt-3.5 text-[12px] font-medium text-ink hover:gap-2.5"
            >
              Re-run the diagnosis <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <Card className="p-5">
            <Label>Free to allocate</Label>
            <Figure className="mt-2 block text-2xl font-semibold tracking-tight text-forest-ink">
              {inr(gf.remaining)}
            </Figure>
            <p className="mt-1.5 text-[12px] leading-relaxed text-meta">
              Left in the discretionary envelope this month after fixed costs
              and the{" "}
              <Figure className="text-ink">{inr(gf.investmentTarget)}</Figure>{" "}
              savings target. Directing it at the lowest incomplete stage moves
              the ladder fastest.
            </p>
            <Link
              href="/simulator"
              className="mt-3.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink hover:gap-2.5"
            >
              Model it in the simulator <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </section>
    </main>
  );
}
