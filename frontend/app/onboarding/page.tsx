"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ButtonLink,
  ButtonRow,
  Choice,
  DisclaimerNote,
  LoadingState,
  Money,
  Stepper,
  Wordmark,
} from "@/components/ui";
import {
  DEBTS,
  ESSENTIALS,
  GOALS,
  LIFESTYLE,
  PRIORITIES,
  STEPS,
  deriveBudget,
  savingsTarget,
  type FinancialProfile,
  type GoalId,
  type Priority,
} from "@/lib/onboarding";
import { rupeesToPaise } from "@/lib/money";
import { formatPercent } from "@/lib/format";
import { displayName, useAuth } from "../providers/AuthProvider";
import { useFinPath } from "../providers/FinPathProvider";
import { AmountField } from "./AmountField";

/**
 * Onboarding (§5) — eight steps, one question each.
 *
 * WHY THIS IS NOT DECORATIVE. Everything typed here goes through
 * `deriveBudget()` into exactly the shape `lib/finance.ts` already scores:
 * a bucket-total map and an allowance. So the health score, the ratios, the
 * guilt-free envelope and the plan are computed by the SAME code that
 * scores a parsed bank statement. There is no second, softer scoring path
 * for declared figures, and nothing on the next screen is invented.
 *
 * THE DRAFT IS NOT PERSISTED UNTIL THE LAST STEP. `saveProfile` writes
 * `completedAt`, which is what `isComplete()` gates on and what the app's
 * route guard reads. A half-finished draft written on every keystroke would
 * mean a student who abandoned at step 3 gets let into a dashboard scored
 * on an income with no expenses — a 100/100 built out of an unanswered
 * question.
 *
 * The running totals under each step are the reason people finish these
 * forms: they turn eight boxes into a conversation with visible
 * consequences.
 */

const TOTAL = STEPS.length;

export default function OnboardingPage() {
  const router = useRouter();
  const { status, session } = useAuth();
  const { profile, saveProfile } = useFinPath();

  const [step, setStep] = React.useState(0);
  // WHY THIS IS NOT JUST useState(profile).
  //
  // `profile` is read through useSyncExternalStore, so on the very first
  // render — the hydration pass — it is deliberately the empty profile: the
  // server has no localStorage to read, and the stored value arrives on the
  // next render. A draft seeded once from that first render would therefore
  // be empty for anyone coming back to change a figure.
  //
  // So the seed is tracked and the draft re-synced during render when the
  // stored profile changes identity. That is React's own "adjusting state
  // when a prop changes" pattern; doing it in an effect would cost a
  // cascading render and trip the repo's lint rule.
  //
  // `seedKey` keys the amount fields, which hold their own text state so a
  // box can be empty rather than showing a 0 nobody typed. Changing the key
  // remounts them with the stored figure once it lands.
  const [seed, setSeed] = React.useState<FinancialProfile>(profile);
  const [draft, setDraft] = React.useState<FinancialProfile>(profile);
  if (seed !== profile) {
    setSeed(profile);
    setDraft(profile);
  }
  const seedKey = profile.completedAt ?? "new";
  const [saved, setSaved] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    if (status === "resolved" && !session) router.replace("/login?next=/onboarding");
  }, [status, session, router]);

  // Moving between steps replaces the whole visible content, so focus has
  // to be sent to the new heading — otherwise it stays on a Next button
  // that no longer means what it did, and a screen-reader user hears
  // nothing at all.
  React.useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  if (status !== "resolved" || !session) {
    return (
      <main id="main" className="page-shell py-16">
        <LoadingState label="Checking your session" />
      </main>
    );
  }

  const current = STEPS[step];
  const budget = deriveBudget(draft);
  const patch = (next: Partial<FinancialProfile>) =>
    setDraft((d) => ({ ...d, ...next }));

  // Only the income step blocks progress: everything else is legitimately
  // zero for somebody, and a form that will not let you past "no debt" is
  // a form that teaches people to type a number they do not mean.
  const blocked = current.id === "income" && draft.monthlyIncome <= 0;

  function finish() {
    saveProfile({ ...draft, completedAt: new Date().toISOString() });
    setSaved(true);
  }

  if (saved) return <Done budget={budget} />;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="page-shell flex h-16 items-center justify-between gap-4">
          <Wordmark href="/" />
          <span className="type-label text-ink-muted">
            Setting up {displayName(session)}&rsquo;s FinPath
          </span>
        </div>
      </header>

      <main id="main" className="page-shell w-full flex-1 py-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
          <Stepper current={step + 1} total={TOTAL} label={current.title} />

          <div key={current.id} className="enter flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="type-display text-ink focus:outline-none"
              >
                {current.title}
              </h1>
              <p className="type-body prose-measure text-ink-secondary">
                {current.purpose}
              </p>
            </div>

            <StepBody
              key={seedKey}
              draft={draft}
              patch={patch}
              stepId={current.id}
            />
          </div>

          <ButtonRow align="start" className="border-t border-line pt-4">
            {step > 0 ? (
              <Button onClick={() => setStep((s) => s - 1)}>Back</Button>
            ) : (
              <ButtonLink href="/">Leave for now</ButtonLink>
            )}

            {step < TOTAL - 1 ? (
              <Button
                variant="primary"
                disabled={blocked}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={finish}>
                Finish and see my health
              </Button>
            )}

            {blocked ? (
              <p className="type-label w-full text-ink-muted">
                An income figure is needed — every ratio on the next screen is
                measured against it.
              </p>
            ) : null}
          </ButtonRow>

          <DisclaimerNote />
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------ step bodies */

function StepBody({
  stepId,
  draft,
  patch,
}: {
  stepId: (typeof STEPS)[number]["id"];
  draft: FinancialProfile;
  patch: (next: Partial<FinancialProfile>) => void;
}) {
  const budget = deriveBudget(draft);

  switch (stepId) {
    case "welcome":
      return (
        <div className="flex flex-col gap-4">
          <p className="type-body prose-measure text-ink-secondary">
            None of this is a test, and none of it is shared. FinPath does not
            connect to your bank, does not hold money, and cannot see anything
            you do not type.
          </p>
          <ul className="flex flex-col">
            {[
              ["What comes in", "Allowance, stipend, salary, freelance work."],
              ["What has to go out", "Rent, food, transport, fees."],
              ["What you choose to spend", "Eating out, shopping, subscriptions."],
              ["What you set aside and what you owe", "Savings, buffer, balances."],
            ].map(([title, body]) => (
              <li key={title} className="ledger-rule py-2">
                <p className="type-subhead text-ink">{title}</p>
                <p className="type-body text-ink-secondary">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      );

    case "income":
      return (
        <div className="flex flex-col gap-4">
          <AmountField
            label="Monthly income, after tax"
            description="Add up everything that arrives in a normal month."
            value={draft.monthlyIncome}
            onValueChange={(v) => patch({ monthlyIncome: v })}
            autoFocus
          />
          <AmountField
            label="Your age"
            description="Used for one thing only: projecting the age at which invested money could cover your living costs."
            value={draft.age}
            onValueChange={(v) => patch({ age: v })}
          />
          {draft.monthlyIncome > 0 ? (
            <Running
              label="A 20% savings rate on that would be"
              value={savingsTarget(draft.monthlyIncome)}
              note="The guideline FinPath measures you against. It is a target, not a rule you have broken."
            />
          ) : null}
        </div>
      );

    case "essentials":
      return (
        <div className="flex flex-col gap-4">
          {ESSENTIALS.map((field) => (
            <AmountField
              key={field.key}
              label={field.label}
              description={field.hint}
              value={draft.essentials[field.key]}
              onValueChange={(v) =>
                patch({ essentials: { ...draft.essentials, [field.key]: v } })
              }
            />
          ))}
          <Running
            label="Essentials each month"
            value={budget.essentialsTotal}
            note={
              draft.monthlyIncome > 0
                ? `${formatPercent(budget.essentialsTotal / draft.monthlyIncome, { digits: 0 })} of your income. The 50/30/20 guideline puts essentials at half.`
                : undefined
            }
          />
        </div>
      );

    case "lifestyle":
      return (
        <div className="flex flex-col gap-4">
          {LIFESTYLE.map((field) => (
            <AmountField
              key={field.key}
              label={field.label}
              description={field.hint}
              value={draft.lifestyle[field.key]}
              onValueChange={(v) =>
                patch({ lifestyle: { ...draft.lifestyle, [field.key]: v } })
              }
            />
          ))}
          <Running
            label="Discretionary spending each month"
            value={budget.lifestyleTotal}
            note={
              draft.monthlyIncome > 0
                ? `${formatPercent(budget.lifestyleTotal / draft.monthlyIncome, { digits: 0 })} of your income. The guideline is 30%.`
                : undefined
            }
          />
        </div>
      );

    case "savings":
      return (
        <div className="flex flex-col gap-4">
          <AmountField
            label="Set aside each month"
            description="Money that actually leaves for savings or investments — not what you hope is left over."
            value={draft.monthlySavings}
            onValueChange={(v) => patch({ monthlySavings: v })}
            autoFocus
          />
          <AmountField
            label="Emergency balance you hold today"
            description="Cash you could reach this week. A total, not a monthly amount."
            value={draft.emergencyFund}
            onValueChange={(v) => patch({ emergencyFund: v })}
          />
          {budget.emergencyTarget > 0 ? (
            <Running
              label="Three months of your essentials"
              value={budget.emergencyTarget}
              note={
                budget.emergencyMonths !== null
                  ? `You currently hold about ${Math.round(budget.emergencyMonths * 10) / 10} months of cover.`
                  : undefined
              }
            />
          ) : null}
        </div>
      );

    case "debt":
      return (
        <div className="flex flex-col gap-4">
          {DEBTS.map((field) => (
            <AmountField
              key={field.key}
              label={field.label}
              description={field.hint}
              value={draft.debts[field.key]}
              onValueChange={(v) =>
                patch({ debts: { ...draft.debts, [field.key]: v } })
              }
            />
          ))}
          <Running
            label="Total outstanding"
            value={budget.debtTotal}
            note="Balances are not counted as monthly spending. They set the first stage of your plan instead."
          />
        </div>
      );

    case "goals":
      return (
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only-text">What are you working toward?</legend>
          {GOALS.map((goal) => {
            const on = draft.goals.includes(goal.id);
            return (
              <Choice
                key={goal.id}
                label={goal.label}
                description={goal.hint}
                checked={on}
                onSelect={(checked) =>
                  patch({
                    goals: checked
                      ? [...draft.goals, goal.id]
                      : draft.goals.filter((g: GoalId) => g !== goal.id),
                  })
                }
              />
            );
          })}
        </fieldset>
      );

    case "priorities":
      return (
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only-text">How should we weigh it up?</legend>
          {PRIORITIES.map((option) => (
            <Choice
              key={option.id}
              type="radio"
              name="priority"
              label={option.label}
              description={option.hint}
              checked={draft.priority === option.id}
              onSelect={() => patch({ priority: option.id as Priority })}
            />
          ))}
        </fieldset>
      );
  }
}

/** The running total under a step. The reason people finish these forms. */
function Running({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <div aria-live="polite" className="flex flex-col gap-1 border-t border-line pt-4">
      <span className="type-label text-ink-muted">{label}</span>
      <span className="ledger-rule w-fit pb-1">
        <Money amount={rupeesToPaise(value)} size="lg" />
      </span>
      {note ? <span className="type-label text-ink-muted">{note}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------ completion */

function Done({ budget }: { budget: ReturnType<typeof deriveBudget> }) {
  return (
    <main
      id="main"
      className="page-shell flex min-h-dvh flex-col items-start justify-center gap-8 py-16"
    >
      <div className="enter flex max-w-2xl flex-col gap-4">
        <p className="type-eyebrow text-ink-muted">Setup complete</p>
        <h1 className="type-display text-ink">Your FinPath is ready.</h1>
        <p className="type-body prose-measure text-ink-secondary">
          Everything from here is worked out from the figures you just
          entered. Change any of them at any time in your profile, and every
          score, ratio and projection follows.
        </p>

        <dl className="flex flex-col">
          {[
            ["Monthly income", budget.allowance],
            ["Essentials", budget.totals.Needs],
            ["Discretionary", budget.totals.Wants],
            ["Set aside", budget.totals.Savings],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="ledger-rule flex items-baseline justify-between gap-4 py-2"
            >
              <dt className="type-label text-ink">{label as string}</dt>
              <dd>
                <Money amount={rupeesToPaise(value as number)} />
              </dd>
            </div>
          ))}
        </dl>

        <ButtonRow align="start">
          <ButtonLink href="/home" variant="primary">
            See my financial health
          </ButtonLink>
          <ButtonLink href="/spending">Upload a statement instead</ButtonLink>
        </ButtonRow>

        <DisclaimerNote />
      </div>
    </main>
  );
}
