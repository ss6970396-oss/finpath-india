"use client";

import * as React from "react";
import {
  ButtonLink,
  Checkbox,
  DisclaimerNote,
  Money,
  PageHeader,
  ProgressMeter,
  Timeline,
  TimelineStage,
} from "@/components/ui";
import { formatPercent } from "@/lib/format";
import { rupeesToPaise } from "@/lib/money";
import { useFinPath } from "../../providers/FinPathProvider";
import { SourceLine } from "../../components/SourceLine";
import { usePlan } from "../../components/usePlan";

/**
 * /plan (§10) — the roadmap, as a vertical ladder.
 *
 * EXACTLY ONE STAGE IS LIVE. `lib/plan.ts` marks the first unfinished stage
 * "attention" and everything after it "upcoming", which is the entire point
 * of ordering these at all: clearing a 40% card while starting a SIP is
 * strictly worse than clearing the card first, and a plan that presents
 * four stages as four simultaneous options has not planned anything.
 *
 * EVERY STAGE STATES HOW ITS PROGRESS WAS MEASURED. That string comes from
 * the plan itself, and where nothing in the data can confirm a step it says
 * so in those words. A progress bar with no stated source is a claim the
 * product cannot back.
 *
 * The tick boxes are the student's own record, persisted locally. They
 * never change a computed figure — a ticked box cannot raise a savings rate.
 */
export default function PlanPage() {
  const { done, toggleTask, profile } = useFinPath();
  const plan = usePlan();

  return (
    <div className="enter flex flex-col gap-16">
      <PageHeader
        title="Your plan"
        purpose="Four stages, in the order a planner would take them. One is live at a time."
      >
        <div className="flex flex-col gap-4">
          <SourceLine />
          <ProgressMeter
            label="Actions completed"
            value={plan.progress}
            detail={`${plan.completedCount} of ${plan.totalCount}`}
            status={
              plan.completedCount === plan.totalCount
                ? "Every action is ticked. The work now is keeping it that way."
                : `${formatPercent(plan.progress, { digits: 0 })} of the plan is ticked off.`
            }
          />
        </div>
      </PageHeader>

      <Timeline>
        {plan.steps.map((step, i) => (
          <TimelineStage
            key={step.id}
            n={step.n}
            title={step.title}
            purpose={step.purpose}
            status={step.status}
            last={i === plan.steps.length - 1}
          >
            <ProgressMeter
              label={`${step.title} progress`}
              value={step.progress}
              detail={
                step.target !== undefined && step.current !== undefined ? (
                  <>
                    <Money amount={rupeesToPaise(step.current)} size="sm" /> of{" "}
                    <Money amount={rupeesToPaise(step.target)} size="sm" />
                  </>
                ) : (
                  formatPercent(step.progress, { digits: 0 })
                )
              }
              status={step.measure}
            />

            <ul className="flex flex-col gap-4">
              {step.actions.map((action) => (
                <li
                  key={action.id}
                  className="flex flex-col gap-2 border border-line px-4 py-4"
                >
                  <Checkbox
                    label={action.title}
                    checked={Boolean(done[action.id])}
                    onCheckedChange={() => toggleTask(action.id)}
                  />
                  <p className="type-body prose-measure pl-6 text-ink-secondary">
                    {action.why}
                  </p>
                  {action.selfAttested ? (
                    <p className="type-label pl-6 text-ink-muted">
                      Nothing in your figures can confirm this one — the tick
                      is your own record, and the stage above says so.
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>

            {step.id === "invest" ? (
              <ButtonLink href="/what-if">
                See what this amount becomes
              </ButtonLink>
            ) : null}
          </TimelineStage>
        ))}
      </Timeline>

      <section className="flex flex-col gap-2 border-t border-line pt-8">
        <h2 className="type-heading text-ink">Why this order</h2>
        <p className="type-body prose-measure text-ink-secondary">
          Debt first, because interest on a revolving balance almost always
          outruns what the same rupee earns invested. Then a buffer, because
          without one the first unexpected bill undoes the investing. Then
          automatic investing, because money invested after spending is money
          invested with whatever was left. Compounding is last only because it
          is the stage that needs the other three to already be true.
        </p>
        <p className="type-body prose-measure text-ink-secondary">
          You told us to weigh this toward{" "}
          <strong className="text-ink">{priorityWord(profile.priority)}</strong>,
          which is why the middle two stages sit in the order they do. You can
          change that in your profile.
        </p>
        <div className="pt-2">
          <ButtonLink href="/profile">Change my priorities</ButtonLink>
        </div>
      </section>

      <DisclaimerNote />
    </div>
  );
}

function priorityWord(priority: string): string {
  if (priority === "growth") return "growth";
  if (priority === "safety") return "safety";
  return "a balance of safety and growth";
}
