"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  ButtonLink,
  ButtonRow,
  Choice,
  DisclaimerNote,
  Money,
  PageHeader,
  Section,
  useToast,
} from "@/components/ui";
import {
  DEBTS,
  ESSENTIALS,
  GOALS,
  LIFESTYLE,
  PRIORITIES,
  deriveBudget,
  type FinancialProfile,
  type GoalId,
  type Priority,
} from "@/lib/onboarding";
import { formatDate } from "@/lib/format";
import { rupeesToPaise } from "@/lib/money";
import { useAuth } from "../../providers/AuthProvider";
import { useFinPath } from "../../providers/FinPathProvider";
import { AmountField } from "../../onboarding/AmountField";

/**
 * /profile (§11).
 *
 * Everything the product knows, in one place, and every field editable
 * where it is displayed. Two rules shape it:
 *
 *   NOTHING IS STORED THAT IS NOT SHOWN HERE. A settings page that lists
 *   preferences while a profile quietly accumulates elsewhere is how people
 *   lose track of what a product holds about them. What follows is the
 *   complete set.
 *
 *   THE FIGURES ARE THE SETTINGS. There is no separate "preferences" screen
 *   full of switches: in a product whose whole output is derived from
 *   declared numbers, editing the numbers IS configuring the product.
 *
 * The draft is local until Save, so a half-typed income never reaches the
 * scoring engines and flashes a wrong health score on the way through.
 */
export default function ProfilePage() {
  const router = useRouter();
  const { session, signOut, isDeviceLocal } = useAuth();
  const { profile, saveProfile } = useFinPath();
  const toast = useToast();

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
  const budget = deriveBudget(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  const patch = (next: Partial<FinancialProfile>) =>
    setDraft((d) => ({ ...d, ...next }));

  function save() {
    saveProfile(draft);
    toast.add({
      title: "Your figures are saved",
      description: "Every score, ratio and projection has been recomputed.",
    });
  }

  return (
    <div className="enter flex flex-col gap-16">
      <PageHeader
        title="Your profile"
        purpose="Everything FinPath holds about you, and every figure it works from."
        actions={
          dirty ? (
            <Button variant="primary" onClick={save}>
              Save changes
            </Button>
          ) : undefined
        }
      />

      {/* ------------------------------------------------------ account */}
      <Section
        title="Account"
        description="Who you are signed in as."
      >
        <dl className="flex flex-col">
          <Row label="Name" value={session?.name || "—"} />
          <Row label="Email" value={session?.email || "—"} />
          <Row
            label="Figures last updated"
            value={
              profile.completedAt ? formatDate(profile.completedAt.slice(0, 10)) : "Never"
            }
          />
        </dl>
      </Section>

      {/* ------------------------------------------------------- income */}
      <Section
        title="Income and age"
        description="Your monthly income is the denominator behind every ratio in the product."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <AmountField
            key={`income:${seedKey}`}
            label="Monthly income, after tax"
            value={draft.monthlyIncome}
            onValueChange={(v) => patch({ monthlyIncome: v })}
          />
          <AmountField
            key={`age:${seedKey}`}
            label="Your age"
            description="Used only to project the age at which invested money could cover your living costs."
            value={draft.age}
            onValueChange={(v) => patch({ age: v })}
          />
        </div>
      </Section>

      {/* --------------------------------------------------- essentials */}
      <Section
        title="Essential spending"
        description="Costs that arrive whether or not you think about them. These become the Needs bucket."
        actions={
          <span className="type-label text-ink-muted">
            Total <Money amount={rupeesToPaise(budget.essentialsTotal)} size="sm" />
          </span>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {ESSENTIALS.map((field) => (
            <AmountField
              key={`${field.key}:${seedKey}`}
              label={field.label}
              description={field.hint}
              value={draft.essentials[field.key]}
              onValueChange={(v) =>
                patch({ essentials: { ...draft.essentials, [field.key]: v } })
              }
            />
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------- lifestyle */}
      <Section
        title="Discretionary spending"
        description="The part you decide each month. These become the Wants bucket."
        actions={
          <span className="type-label text-ink-muted">
            Total <Money amount={rupeesToPaise(budget.lifestyleTotal)} size="sm" />
          </span>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {LIFESTYLE.map((field) => (
            <AmountField
              key={`${field.key}:${seedKey}`}
              label={field.label}
              description={field.hint}
              value={draft.lifestyle[field.key]}
              onValueChange={(v) =>
                patch({ lifestyle: { ...draft.lifestyle, [field.key]: v } })
              }
            />
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------- savings & debt */}
      <Section
        title="Savings and balances"
        description="What you set aside each month, what you hold for emergencies, and what you owe."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <AmountField
            key={`savings:${seedKey}`}
            label="Set aside each month"
            value={draft.monthlySavings}
            onValueChange={(v) => patch({ monthlySavings: v })}
          />
          <AmountField
            key={`buffer:${seedKey}`}
            label="Emergency balance held"
            description="A total, not a monthly amount."
            value={draft.emergencyFund}
            onValueChange={(v) => patch({ emergencyFund: v })}
          />
          {DEBTS.map((field) => (
            <AmountField
              key={`${field.key}:${seedKey}`}
              label={field.label}
              description={field.hint}
              value={draft.debts[field.key]}
              onValueChange={(v) =>
                patch({ debts: { ...draft.debts, [field.key]: v } })
              }
            />
          ))}
        </div>
        <p className="type-label text-ink-muted">
          Three months of your essentials is{" "}
          <Money amount={rupeesToPaise(budget.emergencyTarget)} size="sm" />, which
          is the buffer target your plan works toward. Balances are never
          counted as monthly spending — they set the first stage of the plan.
        </p>
      </Section>

      {/* -------------------------------------------------------- goals */}
      <Section title="Goals" description="These order your plan.">
        <fieldset className="grid gap-2 md:grid-cols-2">
          <legend className="sr-only-text">Your goals</legend>
          {GOALS.map((goal) => (
            <Choice
              key={goal.id}
              label={goal.label}
              description={goal.hint}
              checked={draft.goals.includes(goal.id)}
              onSelect={(checked) =>
                patch({
                  goals: checked
                    ? [...draft.goals, goal.id]
                    : draft.goals.filter((g: GoalId) => g !== goal.id),
                })
              }
            />
          ))}
        </fieldset>
      </Section>

      <Section
        title="What your plan should put first"
        description="This decides the order of the middle two stages. Debt is always first and compounding is always last."
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only-text">Priority</legend>
          {PRIORITIES.map((option) => (
            <Choice
              key={option.id}
              type="radio"
              name="profile-priority"
              label={option.label}
              description={option.hint}
              checked={draft.priority === option.id}
              onSelect={() => patch({ priority: option.id as Priority })}
            />
          ))}
        </fieldset>

        {dirty ? (
          <ButtonRow align="start">
            <Button variant="primary" onClick={save}>
              Save changes
            </Button>
            <Button onClick={() => setDraft(profile)}>Discard changes</Button>
          </ButtonRow>
        ) : null}
      </Section>

      {/* ------------------------------------------- data and security */}
      <Section
        title="Your data and this account"
        description="Where everything above is kept, and what can reach it."
      >
        <ul className="flex flex-col">
          <li className="ledger-rule py-4">
            <p className="type-subhead text-ink">Your figures</p>
            <p className="type-body prose-measure text-ink-secondary">
              Stored in this browser only. They are never sent to the FinPath
              API, which receives nothing but an income figure used to size an
              example month, and the text of any question you ask the coach.
            </p>
          </li>
          <li className="ledger-rule py-4">
            <p className="type-subhead text-ink">Uploaded statements</p>
            <p className="type-body prose-measure text-ink-secondary">
              Parsed on your own device and held in memory for the session.
              They are not written to storage and never leave the browser.
            </p>
          </li>
          <li className="ledger-rule py-4">
            <p className="type-subhead text-ink">Your password</p>
            <p className="type-body prose-measure text-ink-secondary">
              {isDeviceLocal
                ? "This build has no authentication server. Your account exists in this browser, and only a one-way hash of your password is kept — never the password itself. Clearing site data removes the account."
                : "Held by the authentication server. This page never sees it, and no session token is kept in browser storage."}
            </p>
          </li>
        </ul>

        <ButtonRow align="start">
          <ButtonLink href="/sources">Sources and methodology</ButtonLink>
          <ButtonLink href="/onboarding">Redo the setup questions</ButtonLink>
          <Button
            variant="critical"
            onClick={() => {
              void signOut().then(() => router.push("/"));
            }}
          >
            Sign out
          </Button>
        </ButtonRow>
      </Section>

      <DisclaimerNote />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="ledger-rule flex flex-wrap items-baseline justify-between gap-4 py-2">
      <dt className="type-label text-ink-muted">{label}</dt>
      <dd className="type-body text-ink">{value}</dd>
    </div>
  );
}
