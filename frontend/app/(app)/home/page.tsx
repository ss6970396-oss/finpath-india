"use client";

import * as React from "react";
import {
  ActionCard,
  ButtonLink,
  ButtonRow,
  DisclaimerNote,
  Insight,
  Money,
  ProgressMeter,
  ScoreDial,
  Section,
} from "@/components/ui";
import { RULE } from "@/lib/finance";
import { formatPercent } from "@/lib/format";
import { rupeesToPaise } from "@/lib/money";
import { displayName, useAuth } from "../../providers/AuthProvider";
import { useFinPath } from "../../providers/FinPathProvider";
import { SourceLine } from "../../components/SourceLine";
import { useOpportunity, usePlan } from "../../components/usePlan";

/**
 * /home (§6, §26).
 *
 * THE HIERARCHY IS THE DESIGN. Top to bottom, and nothing competes:
 *
 *   1. one score, at a size nothing else on the page approaches
 *   2. the three ratios that produced it, as meters against their targets
 *   3. THE one thing worth doing about it
 *   4. two or three concrete actions
 *   5. the long-term consequence
 *
 * What it deliberately is NOT is four equally weighted tiles. Four numbers
 * of equal size is a page that has declined to say which one matters, which
 * leaves the reader to work out the priority — the work they opened the
 * product to have done for them.
 *
 * "SINCE YOUR LAST REVIEW" IS REAL OR ABSENT. The previous snapshot is read
 * once on mount and this visit's snapshot is written after. With no prior
 * visit there is no delta and the line simply does not appear — a product
 * with no history must not manufacture a trend.
 */
export default function HomePage() {
  const { session } = useAuth();
  const { health, ratio, allowance, totals, envelope, lastReview, recordReview } =
    useFinPath();
  const plan = usePlan();
  const opportunity = useOpportunity();

  // Captured before this visit overwrites it, so the comparison is against
  // the LAST visit rather than against the value being written right now.
  const [previous] = React.useState(() => lastReview);

  React.useEffect(() => {
    recordReview({
      score: health.score,
      savingsRate: ratio.Savings,
      wantsRate: ratio.Wants,
      at: new Date().toISOString(),
    });
  }, [health.score, ratio.Savings, ratio.Wants, recordReview]);

  const delta = previous ? health.score - previous.score : null;
  const nextBest = plan.open.slice(0, 3);

  return (
    <div className="enter flex flex-col gap-16">
      {/* ------------------------------------------------ 1. the score */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="type-display text-ink">
            {greeting()}, {displayName(session)}.
          </h1>
          <SourceLine />
        </div>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-center">
          <ScoreDial
            score={health.score}
            band={health.band}
            caption={bandCaption(health.band)}
          />

          <div className="flex flex-col gap-4">
            <h2 className="type-eyebrow text-ink-muted">
              How the score was built
            </h2>

            <ProgressMeter
              label="Savings rate"
              value={ratio.Savings}
              target={RULE.savings}
              detail={formatPercent(ratio.Savings, { digits: 0 })}
              status={
                ratio.Savings >= RULE.savings
                  ? `On target — ${health.parts.savings} of 40 points`
                  : `Below the 20% target — ${health.parts.savings} of 40 points`
              }
            />

            <ProgressMeter
              label="Discretionary spending"
              value={ratio.Wants}
              target={RULE.wants}
              detail={formatPercent(ratio.Wants, { digits: 0 })}
              status={
                ratio.Wants > RULE.wants
                  ? `Above the 30% target — ${health.parts.wants} of 30 points`
                  : `Within target — ${health.parts.wants} of 30 points`
              }
            />

            <ProgressMeter
              label="Essentials"
              value={ratio.Needs}
              target={RULE.needs}
              detail={formatPercent(ratio.Needs, { digits: 0 })}
              status={
                ratio.Needs > RULE.needs
                  ? `Above the 50% target — ${health.parts.needs} of 15 points`
                  : `Within target — ${health.parts.needs} of 15 points`
              }
            />

            {delta !== null && delta !== 0 ? (
              <p className="type-label text-ink-muted">
                {delta > 0 ? "Up" : "Down"} {Math.abs(delta)}{" "}
                {Math.abs(delta) === 1 ? "point" : "points"} since your last
                review. That is a comparison with your own previous visit, not
                with anyone else.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- 2. key numbers */}
      <Section
        title="Your month, in three numbers"
        description="Everything else on this page is derived from these."
      >
        <dl className="grid gap-8 sm:grid-cols-3">
          <Figure
            label="Money in"
            amount={allowance}
            note="The denominator every ratio is measured against."
          />
          <Figure
            label="Discretionary spending"
            amount={totals.Wants ?? 0}
            note={`Target is ${formatPercent(RULE.wants, { digits: 0 })} of income, which for you is `}
            noteAmount={allowance * RULE.wants}
          />
          <Figure
            label="Free to spend, guilt-free"
            amount={envelope.remaining}
            note="What is left once essentials and your savings target are set aside. Roughly this much a day for the rest of the month: "
            noteAmount={envelope.perDay}
          />
        </dl>
      </Section>

      {/* ------------------------------------------ 3. the opportunity */}
      <Insight
        title={opportunity.title}
        detail={opportunity.detail}
        tone={opportunity.tone}
        amount={
          opportunity.amount !== null ? (
            <Money amount={rupeesToPaise(opportunity.amount)} size="xl" />
          ) : undefined
        }
        amountLabel={
          opportunity.amount !== null
            ? "Worked out from your own figures, not a rule of thumb."
            : undefined
        }
        action={
          <ButtonLink href={opportunity.href} variant="primary">
            {opportunity.actionLabel}
          </ButtonLink>
        }
      />

      {/* ------------------------------------------- 4. next actions */}
      <Section
        title="Your next best actions"
        description={`${plan.completedCount} of ${plan.totalCount} actions completed across the whole plan.`}
        actions={<ButtonLink href="/plan">View my plan</ButtonLink>}
      >
        {nextBest.length === 0 ? (
          <p className="type-body prose-measure text-ink-secondary">
            Nothing is outstanding right now. That is the point at which the
            work becomes holding the line rather than fixing something — check
            back after your next month lands.
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {nextBest.map((action, i) => (
              <li key={action.id}>
                <ActionCard
                  n={i + 1}
                  title={action.title}
                  why={action.why}
                  selfAttested={action.selfAttested}
                  action={<ButtonLink href="/plan">Open in the plan</ButtonLink>}
                />
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* ------------------------------------- 5. long-term consequence */}
      <Section
        title="Where this goes over time"
        description="The same figures, projected forward."
      >
        <p className="type-body prose-measure text-ink-secondary">
          What you set aside each month is the only lever on this page whose
          effect keeps growing after you stop touching it. The scenario
          explorer shows what your current amount becomes, what a 10% annual
          increase does to it, and what waiting a year costs.
        </p>
        <ButtonRow align="start">
          <ButtonLink href="/what-if" variant="primary">
            Explore scenarios
          </ButtonLink>
          <ButtonLink href="/spending">See where the money went</ButtonLink>
        </ButtonRow>
        <DisclaimerNote variant="projection" />
      </Section>
    </div>
  );
}

/* -------------------------------------------------------------- helpers */

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function bandCaption(band: string): string {
  switch (band) {
    case "Strong":
      return "Saving above target with discretionary spending under control.";
    case "Stable":
      return "The fundamentals are sound. One or two things are off target.";
    case "Strained":
      return "More is going out than the guidelines allow. It is fixable this month.";
    default:
      return "Very little is reaching savings. Start with the single item below.";
  }
}

function Figure({
  label,
  amount,
  note,
  noteAmount,
}: {
  label: string;
  amount: number;
  note: string;
  noteAmount?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="type-label text-ink-muted">{label}</dt>
      <dd className="ledger-rule pb-2">
        <Money amount={rupeesToPaise(amount)} size="lg" />
      </dd>
      <dd className="type-label text-ink-muted">
        {note}
        {noteAmount !== undefined ? (
          <Money amount={rupeesToPaise(noteAmount)} size="sm" tone="muted" />
        ) : null}
      </dd>
    </div>
  );
}
