"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import {
  BareInput,
  Button,
  ButtonLink,
  DisclaimerNote,
  Metric,
  ProgressMeter,
  ScoreDial,
  SectionLabel,
} from "@/components/ui";
import { RULE } from "@/lib/finance";
import { formatINR, formatPercent } from "@/lib/format";
import { rupeesToPaise } from "@/lib/money";
import type { Opportunity } from "@/lib/plan";
import { PART_LABEL, scoreDriver } from "@/lib/score";
import { priorities } from "@/lib/action-meta";
import { displayName, useAuth } from "../../providers/AuthProvider";
import { useFinPath } from "../../providers/FinPathProvider";
import { SourceLine } from "../../components/SourceLine";
import { SecondaryLinks } from "../../components/SecondaryLinks";
import { useOpportunity, usePlan } from "../../components/usePlan";
import { PlanActionCard } from "../../components/PlanActionCard";

/**
 * /home (§6, §26) — the primary screen. It answers one question within the
 * first screenful on a phone: what should I do next?
 *
 * Six sections, in this order, separated by hairlines and nothing else:
 *
 *   1. greeting — your name, and one plain sentence on where you stand
 *      (the biggest opportunity, with its figure and a link to the fix)
 *   2. the Money Health Score, with the one thing driving it
 *   3. the top three actions from the plan; the first holds the screen's
 *      only primary button
 *   4. a few figures, in tabular numerals
 *   5. a question box that opens Ask with the question prefilled
 *   6. the way to Spending and What-if
 *
 * Nothing else. The three score meters are still here, one tap away under
 * "How the score was built", because they are the working behind the
 * number; the long-term paragraph and the separate opportunity block are
 * gone, their content folded into sections 1 and 3.
 *
 * "SINCE YOUR LAST VISIT" IS REAL OR ABSENT. The previous snapshot is read
 * once on mount and this visit's snapshot is written after. With no prior
 * visit there is no delta and the phrase simply does not appear.
 */
export default function HomePage() {
  const router = useRouter();
  const { session } = useAuth();
  const {
    health, ratio, allowance, totals, envelope, budget, source, data,
    setUseExample, lastReview, recordReview,
  } = useFinPath();
  const plan = usePlan();
  const opportunity = useOpportunity();
  const [question, setQuestion] = React.useState("");

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
  const driver = scoreDriver(health);
  const nextBest = plan.open.slice(0, 3);
  const rank = React.useMemo(() => priorities(plan), [plan]);
  const noSpending = source === "declared";

  function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    router.push(q ? `/ask?q=${encodeURIComponent(q)}` : "/ask");
  }

  return (
    <div className="enter flex flex-col gap-12">
      {/* ------------------------------------------------ 1. greeting */}
      <section className="flex flex-col gap-4">
        <h1 className="type-display text-ink">
          {greeting()}, {displayName(session)}.
        </h1>
        <p className="type-body prose-measure text-ink">
          <Standing opportunity={opportunity} />{" "}
          {!opportunity.clear ? (
            <Link
              href={opportunity.href}
              className="inline-flex items-center gap-1 text-accent underline underline-offset-4 hover:text-ink"
            >
              {/* lib/plan.ts still says "See the plan"; the page is Actions now. */}
              {opportunity.href === "/plan" ? "See your actions" : opportunity.actionLabel}
              <ArrowRight className="lucide size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </p>
        <SourceLine />
        {source === "example" ? <DisclaimerNote variant="example" /> : null}
      </section>

      {/* ------------------------------------------------ 2. the score */}
      <section
        aria-labelledby="score-heading"
        className="flex flex-col gap-4 border-t border-line pt-8"
      >
        <SectionLabel id="score-heading">
          Money health score
        </SectionLabel>
        <ScoreDial
          score={health.score}
          band={health.band}
          caption={driverLine(driver, delta)}
        />
        <details className="mx-auto w-full max-w-(--container-prose)">
          <summary className="type-label min-h-11 cursor-pointer py-2 text-ink-secondary underline underline-offset-4 hover:text-ink">
            How the score was built
          </summary>
          <div className="flex flex-col gap-4 pt-4">
            <ProgressMeter
              label="Savings rate"
              value={ratio.Savings}
              target={RULE.savings}
              detail={formatPercent(ratio.Savings, { digits: 0 })}
              status={`${ratio.Savings >= RULE.savings ? "On target" : "Below the 20% target"} — ${health.parts.savings} of 40 points`}
            />
            <ProgressMeter
              label="Discretionary spending"
              value={ratio.Wants}
              target={RULE.wants}
              detail={formatPercent(ratio.Wants, { digits: 0 })}
              status={`${ratio.Wants > RULE.wants ? "Above the 30% target" : "Within target"} — ${health.parts.wants} of 30 points`}
            />
            <ProgressMeter
              label="Essentials"
              value={ratio.Needs}
              target={RULE.needs}
              detail={formatPercent(ratio.Needs, { digits: 0 })}
              status={`${ratio.Needs > RULE.needs ? "Above the 50% target" : "Within target"} — ${health.parts.needs} of 15 points`}
            />
            <p className="type-label text-ink-muted">
              Unspent buffer: {health.parts.buffer} of 15 points, for what is
              left at the end of the month.{" "}
              <Link
                href="/sources#method"
                className="underline underline-offset-4 hover:text-ink"
              >
                The full method
              </Link>
            </p>
          </div>
        </details>
        <DisclaimerNote className="mx-auto text-center" />
      </section>

      {/* --------------------------------------------- 3. top actions */}
      <section
        aria-labelledby="actions-heading"
        className="flex flex-col gap-4 border-t border-line pt-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="actions-heading" className="type-heading text-ink">
            Your next steps
          </h2>
          <Link
            href="/plan"
            className="type-label inline-flex min-h-11 items-center text-accent underline underline-offset-4 hover:text-ink"
          >
            All {plan.totalCount} actions
          </Link>
        </div>

        {nextBest.length === 0 ? (
          <p className="type-body prose-measure text-ink-secondary">
            Nothing is outstanding right now. The work now is holding the line
            — check back after your next month lands.
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {nextBest.map((action, i) => (
              <li key={action.id}>
                <PlanActionCard
                  n={i + 1}
                  action={action}
                  priority={rank[action.id] ?? "low"}
                  primary={i === 0}
                />
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ------------------------------------------- 4. progress figures */}
      <section
        aria-labelledby="figures-heading"
        className="flex flex-col gap-4 border-t border-line pt-8"
      >
        <SectionLabel id="figures-heading">
          This month
        </SectionLabel>

        {noSpending ? (
          // The empty state for a student with no spending data yet — which
          // is every student straight out of onboarding. One next step,
          // named, with the example month as the honest alternative.
          <div className="flex flex-col gap-2 border-l-2 border-ink pl-4">
            <p className="type-body prose-measure text-ink">
              These figures are the estimates you entered. Import a statement
              or use an example month to see your actual spending.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <ButtonLink href="/spending">Import a statement</ButtonLink>
              <Button
                variant="ghost"
                onClick={() => setUseExample(true)}
                disabled={!data}
              >
                Use an example month
              </Button>
            </div>
            {!data ? (
              <p className="type-label text-ink-muted">
                The example month comes from the FinPath API, which is not
                answering right now.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Money in"
            amount={rupeesToPaise(allowance)}
            note="The denominator every ratio uses."
          />
          <Metric
            label="Discretionary spending"
            amount={rupeesToPaise(totals.Wants ?? 0)}
            note={`Target: ${formatINR(rupeesToPaise(allowance * RULE.wants))}, 30% of income.`}
          />
          <Metric
            label="Free to spend, guilt-free"
            amount={rupeesToPaise(envelope.remaining)}
            note={`About ${formatINR(rupeesToPaise(envelope.perDay))} a day for the rest of the month.`}
          />
          <Metric
            label="Actions done"
            value={`${plan.completedCount} of ${plan.totalCount}`}
            note="Across all four stages of your plan."
          />
        </div>
        {budget.debtTotal > 0 ? (
          <p className="type-label text-ink-muted">
            You also told us you owe{" "}
            {formatINR(rupeesToPaise(budget.debtTotal))} in outstanding
            balances, which is why clearing it comes first.
          </p>
        ) : null}
      </section>

      {/* ------------------------------------------------- 5. ask */}
      <section
        aria-labelledby="ask-heading"
        className="flex flex-col gap-2 border-t border-line pt-8"
      >
        <SectionLabel id="ask-heading">
          Ask a question
        </SectionLabel>
        <form
          onSubmit={ask}
          className="flex max-w-(--container-prose) items-stretch gap-2"
        >
          <label htmlFor="home-ask" className="sr-only-text">
            Ask about budgeting, SIPs, credit and more
          </label>
          <BareInput
            id="home-ask"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about budgeting, SIPs, credit…"
            className="min-h-11"
          />
          <Button type="submit" className="h-auto min-h-11 shrink-0">
            <MessageCircleQuestion className="lucide size-4" aria-hidden="true" />
            Ask
          </Button>
        </form>
        <p className="type-label text-ink-muted">
          Opens Ask with your question ready to send.
        </p>
      </section>

      {/* ------------------------------------------- 6. secondary */}
      <SecondaryLinks />
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

/**
 * The one plain sentence under the greeting: the biggest opportunity, with
 * its figure, stated neutrally. The wording is keyed on the opportunity
 * `lib/plan.ts` chose; an unrecognised one falls back to its own title, so
 * a new opportunity added to the engine still reads correctly.
 */
function Standing({ opportunity }: { opportunity: Opportunity }) {
  const amount =
    opportunity.amount !== null
      ? formatINR(rupeesToPaise(opportunity.amount))
      : null;

  const phrase: Record<string, string> = {
    "Your costliest money is borrowed money": `You have ${amount} outstanding, and clearing it comes before anything else.`,
    "Discretionary spending is above your target": `${amount} went to wants this month above your 30% line.`,
    "Your savings rate is below target": `You are ${amount} a month short of saving 20% of your income.`,
    "Your emergency buffer is short of three months": `Your buffer is ${amount} short of three months of essentials.`,
    "Nothing is off target this month":
      "Nothing is off target this month. Hold the line as your income rises.",
  };

  return <>{phrase[opportunity.title] ?? `${opportunity.title}.`}</>;
}

/** "Savings rate is holding it back most: 18 of 40 points." plus any real delta. */
function driverLine(
  driver: ReturnType<typeof scoreDriver>,
  delta: number | null,
): string {
  const main = driver
    ? `${PART_LABEL[driver.part]} is holding it back most: ${driver.earned} of ${driver.max} points.`
    : "Every part of the score is at full marks.";
  if (delta === null || delta === 0) return main;
  const n = Math.abs(delta);
  return `${main} ${delta > 0 ? "Up" : "Down"} ${n} ${n === 1 ? "point" : "points"} since your last visit.`;
}
