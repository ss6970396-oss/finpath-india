"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  ButtonRow,
  Choice,
  DisclaimerNote,
  Money,
  PageHeader,
  SectionLabel,
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
import { cn } from "@/lib/utils";
import { useAuth } from "../../providers/AuthProvider";
import { useFinPath } from "../../providers/FinPathProvider";
import { AmountField } from "../../onboarding/AmountField";

/**
 * /profile (§11) — everything FinPath holds about you, in four blocks.
 *
 *   Personal   who you are signed in as, and your age
 *   Income     every figure the scores are built from
 *   Goals      what orders your plan
 *   Security   where the account and the data live, and signing out
 *
 * Each editable block reads as a plain list until you choose Edit; then it
 * becomes a small form with Save (primary) and Cancel. One block is edited
 * at a time, and nothing reaches the scoring engines until Save — a
 * half-typed income must never flash a wrong score on the way through.
 *
 * ONLY WHAT EXISTS. Name and email are shown read-only: the auth contract
 * (lib/auth.ts) has no call that changes them. Security has no Edit button
 * at all: on this build the account lives in the browser and there is no
 * change-password to offer, so it states the facts and offers sign-out.
 * Nothing here is invented to make a section look fuller.
 */

type BlockId = "personal" | "income" | "goals";

export default function ProfilePage() {
  const router = useRouter();
  const { session, signOut, isDeviceLocal } = useAuth();
  const { profile, saveProfile } = useFinPath();
  const toast = useToast();

  const [editing, setEditing] = React.useState<BlockId | null>(null);
  const [draft, setDraft] = React.useState<FinancialProfile>(profile);
  // Remounts the amount fields with the stored figures on each Edit, since
  // they keep their own text so a box can be blank rather than "0".
  const [editRound, setEditRound] = React.useState(0);

  const patch = (next: Partial<FinancialProfile>) =>
    setDraft((d) => ({ ...d, ...next }));

  function edit(block: BlockId) {
    setDraft(profile);
    setEditRound((n) => n + 1);
    setEditing(block);
  }

  function save() {
    saveProfile(draft);
    setEditing(null);
    toast.add({
      title: "Your figures are saved",
      description: "Every score, ratio and projection has been recomputed.",
    });
  }

  const shown = editing ? draft : profile;
  const budget = deriveBudget(shown);
  const k = (name: string) => `${name}:${editRound}`;

  return (
    <div className="enter flex flex-col gap-12">
      <PageHeader
        title="Your profile"
        purpose="Everything FinPath holds about you, and every figure it works from."
      />

      {/* ---------------------------------------------------- personal */}
      <Block
        label="Personal"
        editing={editing === "personal"}
        locked={editing !== null && editing !== "personal"}
        onEdit={() => edit("personal")}
        onSave={save}
        onCancel={() => setEditing(null)}
      >
        <Rows>
          <Row label="Name">{session?.name || "—"}</Row>
          <Row label="Email">{session?.email || "—"}</Row>
          {editing === "personal" ? (
            <div className="max-w-xs py-4">
              <AmountField
                key={k("age")}
                label="Your age"
                description="Used only to project the age at which invested money could cover your living costs."
                value={draft.age}
                onValueChange={(v) => patch({ age: v })}
              />
            </div>
          ) : (
            <Row label="Age">
              <span className="type-data">{profile.age}</span>
            </Row>
          )}
        </Rows>
        <p className="type-label text-ink-muted">
          Your name and email cannot be changed on this build.
        </p>
      </Block>

      {/* ------------------------------------------------------ income */}
      <Block
        label="Income and spending"
        editing={editing === "income"}
        locked={editing !== null && editing !== "income"}
        primaryEdit
        onEdit={() => edit("income")}
        onSave={save}
        onCancel={() => setEditing(null)}
      >
        {editing === "income" ? (
          <div className="flex flex-col gap-8">
            <Fields title="Money in">
              <AmountField
                key={k("income")}
                label="Monthly income, after tax"
                description="The denominator behind every ratio in the product."
                value={draft.monthlyIncome}
                onValueChange={(v) => patch({ monthlyIncome: v })}
              />
            </Fields>
            <Fields title="Essential spending" total={budget.essentialsTotal}>
              {ESSENTIALS.map((f) => (
                <AmountField
                  key={k(f.key)}
                  label={f.label}
                  description={f.hint}
                  value={draft.essentials[f.key]}
                  onValueChange={(v) =>
                    patch({ essentials: { ...draft.essentials, [f.key]: v } })
                  }
                />
              ))}
            </Fields>
            <Fields title="Discretionary spending" total={budget.lifestyleTotal}>
              {LIFESTYLE.map((f) => (
                <AmountField
                  key={k(f.key)}
                  label={f.label}
                  description={f.hint}
                  value={draft.lifestyle[f.key]}
                  onValueChange={(v) =>
                    patch({ lifestyle: { ...draft.lifestyle, [f.key]: v } })
                  }
                />
              ))}
            </Fields>
            <Fields title="Savings and balances">
              <AmountField
                key={k("savings")}
                label="Set aside each month"
                value={draft.monthlySavings}
                onValueChange={(v) => patch({ monthlySavings: v })}
              />
              <AmountField
                key={k("buffer")}
                label="Emergency balance held"
                description="A total, not a monthly amount."
                value={draft.emergencyFund}
                onValueChange={(v) => patch({ emergencyFund: v })}
              />
              {DEBTS.map((f) => (
                <AmountField
                  key={k(f.key)}
                  label={f.label}
                  description={f.hint}
                  value={draft.debts[f.key]}
                  onValueChange={(v) =>
                    patch({ debts: { ...draft.debts, [f.key]: v } })
                  }
                />
              ))}
            </Fields>
          </div>
        ) : (
          <Rows>
            <Row label="Monthly income">
              <Money amount={rupeesToPaise(profile.monthlyIncome)} />
            </Row>
            <Row label="Essentials each month">
              <Money amount={rupeesToPaise(budget.essentialsTotal)} />
            </Row>
            <Row label="Discretionary each month">
              <Money amount={rupeesToPaise(budget.lifestyleTotal)} />
            </Row>
            <Row label="Set aside each month">
              <Money amount={rupeesToPaise(profile.monthlySavings)} />
            </Row>
            <Row label="Emergency balance">
              <Money amount={rupeesToPaise(profile.emergencyFund)} />
            </Row>
            <Row label="Outstanding balances">
              <Money amount={rupeesToPaise(budget.debtTotal)} />
            </Row>
          </Rows>
        )}
        <p className="type-label text-ink-muted">
          Three months of your essentials is{" "}
          <Money amount={rupeesToPaise(budget.emergencyTarget)} size="sm" />,
          the buffer your plan works toward. Balances are never counted as
          monthly spending — they set the first stage of the plan. Figures
          last updated{" "}
          {profile.completedAt ? formatDate(profile.completedAt.slice(0, 10)) : "never"}
          .{" "}
          <Link href="/onboarding" className="underline underline-offset-4 hover:text-ink">
            Redo the setup questions
          </Link>
        </p>
      </Block>

      {/* ------------------------------------------------------- goals */}
      <Block
        label="Goals"
        editing={editing === "goals"}
        locked={editing !== null && editing !== "goals"}
        onEdit={() => edit("goals")}
        onSave={save}
        onCancel={() => setEditing(null)}
      >
        {editing === "goals" ? (
          <div className="flex flex-col gap-8">
            <fieldset className="grid gap-2 md:grid-cols-2">
              <legend className="type-subhead mb-2 text-ink">What you are working toward</legend>
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
            <fieldset className="flex flex-col gap-2">
              <legend className="type-subhead mb-2 text-ink">
                What your plan should put first
              </legend>
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
          </div>
        ) : (
          <Rows>
            <Row label="Working toward">
              {profile.goals.length
                ? GOALS.filter((g) => profile.goals.includes(g.id))
                    .map((g) => g.label)
                    .join(", ")
                : "None chosen yet"}
            </Row>
            <Row label="Plan puts first">
              {PRIORITIES.find((p) => p.id === profile.priority)?.label ?? "—"}
            </Row>
          </Rows>
        )}
        <p className="type-label text-ink-muted">
          Priority decides the order of the plan&rsquo;s middle two stages.
          Debt is always first and compounding always last.
        </p>
      </Block>

      {/* ---------------------------------------------------- security */}
      <Block label="Security">
        <Rows>
          <Row label="Your account">
            {isDeviceLocal
              ? "Exists only in this browser. There is no authentication server on this build."
              : "Held by the authentication server."}
          </Row>
          <Row label="Your password">
            {isDeviceLocal
              ? "Never stored. Only a one-way hash is kept, to check the next sign-in."
              : "Held by the server. This page never sees it, and no token is kept in browser storage."}
          </Row>
          <Row label="Your figures">
            Stored in this browser, under this account only. The API receives
            an income figure to size an example month, and the text of the
            questions you ask.
          </Row>
          <Row label="Uploaded statements">
            Parsed on your device and held in memory for this session. Never
            written to storage, never sent anywhere.
          </Row>
        </Rows>
        {isDeviceLocal ? (
          <p className="type-label text-ink-muted">
            Clearing this site&rsquo;s data removes the account and its
            figures. There is no password change or recovery on this build.
          </p>
        ) : null}
        <ButtonRow align="start">
          <Button
            onClick={() => {
              void signOut().then(() => router.push("/"));
            }}
          >
            Sign out
          </Button>
          <Link
            href="/sources"
            className="type-label inline-flex min-h-11 items-center text-accent underline underline-offset-4 hover:text-ink"
          >
            How FinPath works
          </Link>
        </ButtonRow>
      </Block>

      <DisclaimerNote />
    </div>
  );
}

/* -------------------------------------------------------------- pieces */

/**
 * One bordered block: a section label, an Edit button, and — while editing
 * — Save and Cancel. Without `onEdit` it is a read-only block (Security).
 * `locked` hides Edit while another block is open, so one form is live at
 * a time. `primaryEdit` makes this block's Edit the page's one primary
 * action: the figures are what the profile is for.
 */
function Block({
  label,
  editing = false,
  locked = false,
  primaryEdit = false,
  onEdit,
  onSave,
  onCancel,
  children,
}: {
  label: string;
  editing?: boolean;
  locked?: boolean;
  primaryEdit?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  const headingId = React.useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "flex flex-col gap-4 border p-6",
        editing ? "border-line-strong" : "border-line",
      )}
    >
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
        <SectionLabel id={headingId}>
          {label}
        </SectionLabel>
        {onEdit && !editing && !locked ? (
          <Button variant={primaryEdit ? "primary" : "secondary"} size="sm" onClick={onEdit}>
            Edit <span className="sr-only-text">{label.toLowerCase()}</span>
          </Button>
        ) : null}
      </div>
      {children}
      {editing ? (
        <ButtonRow align="start" className="border-t border-line pt-4">
          <Button variant="primary" onClick={onSave}>
            Save
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </ButtonRow>
      ) : null}
    </section>
  );
}

function Rows({ children }: { children: React.ReactNode }) {
  return <dl className="flex flex-col">{children}</dl>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
      <dt className="type-label shrink-0 text-ink-muted">{label}</dt>
      <dd className="type-body text-ink sm:text-right">{children}</dd>
    </div>
  );
}

function Fields({
  title,
  total,
  children,
}: {
  title: string;
  total?: number;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="type-subhead mb-2 flex w-full flex-wrap items-baseline justify-between gap-2 text-ink">
        {title}
        {total !== undefined ? (
          <span className="type-label text-ink-muted">
            Total <Money amount={rupeesToPaise(total)} size="sm" />
          </span>
        ) : null}
      </legend>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}
