"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, House, BookOpen, MessageSquare, Wallet, Target } from "lucide-react";
import {
  DisclaimerNote,
  EmptyState,
  ErrorState,
  LedgerList,
  LedgerRule,
  LoadingSkeleton,
  LockedState,
  Money,
  OfflineBar,
  ThemeToggle,
} from "@/components/finpath";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

/**
 * The review surface for Section 13. Every token, every type role and every
 * primitive on one page, so a regression is visible in one scroll rather than
 * hunted across seven screens.
 *
 * This page is a client component on purpose: it reads the resolved value of
 * each token out of the DOM, which is the only way a swatch can prove it is
 * showing the real token rather than a hardcoded hex that happens to match.
 */

/* ------------------------------------------------------------------ shell */

function Section({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-rule pt-8">
      <p className="overline-ui text-ink-muted">{n}</p>
      <h2 className="display-lg mt-1 text-ink">{title}</h2>
      {note ? (
        <p className="body-base mt-2 max-w-[68ch] text-ink-muted">{note}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Card({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="rounded-md border border-rule bg-surface p-4 shadow-card md:p-6">
      {label ? (
        <p className="overline-ui mb-4 text-ink-muted">{label}</p>
      ) : null}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ tokens */

const COLOUR_TOKENS = [
  ["--color-paper", "Page background"],
  ["--color-surface", "Cards, wells, inputs"],
  ["--color-rule", "All hairlines, borders, dividers"],
  ["--color-ink", "Headings, primary text, amounts"],
  ["--color-ink-muted", "Labels, captions, secondary text"],
  ["--color-accent", "Primary buttons, links, active nav"],
  ["--color-accent-weak", "Badges, selected rows"],
  ["--color-warn", "State only: a rule has fired"],
  ["--color-warn-weak", "Nudge card ground"],
  ["--color-danger", "Destructive actions, failed states"],
  ["--color-danger-weak", "Error alert ground"],
] as const;

function Swatch({ token, role }: { token: string; role: string }) {
  const [value, setValue] = useState("");

  // Re-read after any class change on <html>, so switching theme updates the
  // printed hex rather than leaving a stale light-mode value on screen.
  useEffect(() => {
    const read = () =>
      setValue(
        getComputedStyle(document.documentElement)
          .getPropertyValue(token)
          .trim(),
      );
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [token]);

  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="h-10 w-10 shrink-0 rounded-sm border border-rule"
        style={{ background: `var(${token})` }}
      />
      <span className="min-w-0">
        <span className="label-ui block truncate text-ink">{token}</span>
        <span className="caption block text-ink-muted">{role}</span>
        <span className="tnum block text-[0.6875rem] uppercase text-ink-muted">
          {value || "—"}
        </span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------- type roles */

const TYPE_ROLES = [
  ["display-xl", "Newsreader 44/48 → 60/64", "₹0 savings to your first SIP"],
  ["display-lg", "Newsreader 32/38 → 40/46", "This month, August"],
  ["display-md", "Newsreader 24/30", "What a SIP is"],
  ["body-lg", "Plex Sans 17/26", "A credit card is a borrowing instrument, not income."],
  ["body-base", "Plex Sans 15/22", "Default interface text sits at this size."],
  ["label-ui", "Plex Sans 13/18", "Monthly allowance"],
  ["caption", "Plex Sans 12/16", "Illustrative. Not a projection."],
  ["overline-ui", "Plex Sans 11/14, 0.10em", "This month"],
  ["amount-xl", "Plex Mono 34/38, tabular", "₹1,08,240"],
  ["amount", "Plex Mono 15/22, tabular", "₹4,280"],
] as const;

/* -------------------------------------------------------------------- page */

export default function StyleGuidePage() {
  const [offline, setOffline] = useState(false);

  return (
    <>
      <OfflineBar online={!offline} />

      <div className="mx-auto w-full max-w-[1120px] px-4 py-10 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 pb-8">
          <div>
            <p className="overline-ui text-ink-muted">Section 3 · Phase 1</p>
            <h1 className="display-xl mt-2 text-ink">Style guide</h1>
            <p className="body-lg mt-3 max-w-[68ch] text-ink-muted">
              The whole design system on one page. If a colour, type role,
              radius or shadow is not here, it does not exist in this product.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex flex-col gap-12">
          {/* ------------------------------------------------- colour */}
          <Section
            n="3.2"
            title="Colour"
            note="Six roles and two semantics. Dark mode re-points the same eleven variables — it never introduces a twelfth. Hex values are read live from the document, so what you see below is what the utilities actually resolve to."
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {COLOUR_TOKENS.map(([token, role]) => (
                <Swatch key={token} token={token} role={role} />
              ))}
            </div>
          </Section>

          {/* --------------------------------------------------- type */}
          <Section
            n="3.3"
            title="Typography"
            note="Newsreader for display, IBM Plex Sans for interface copy, IBM Plex Mono for every numeral. Amounts are always tabular."
          >
            <div className="flex flex-col gap-6">
              {TYPE_ROLES.map(([role, spec, sample]) => (
                <div
                  key={role}
                  className="grid gap-2 border-b border-rule pb-6 last:border-0 md:grid-cols-[200px_1fr] md:gap-6"
                >
                  <div>
                    <p className="label-ui text-ink">{role}</p>
                    <p className="caption text-ink-muted">{spec}</p>
                  </div>
                  <p className={`${role} min-w-0 text-ink`}>{sample}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ------------------------------------------------- shape */}
          <Section
            n="3.4 / 3.5"
            title="Shape, elevation, motion"
            note="Two shadows, four radii, three durations. Nothing rounds past 10px except an avatar or a pill."
          >
            <div className="grid gap-6 md:grid-cols-3">
              <Card label="Radius">
                <div className="flex flex-wrap items-end gap-4">
                  {(["sm", "md", "lg", "full"] as const).map((r) => (
                    <div key={r} className="text-center">
                      <div
                        className="h-14 w-14 border border-rule bg-surface"
                        style={{ borderRadius: `var(--radius-${r})` }}
                      />
                      <p className="caption mt-2 text-ink-muted">{r}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card label="Elevation">
                <div className="flex flex-wrap gap-4">
                  <div className="rounded-md border border-rule bg-paper px-4 py-6 shadow-card">
                    <p className="caption text-ink-muted">shadow-card</p>
                  </div>
                  <div className="rounded-md border border-rule bg-paper px-4 py-6 shadow-float">
                    <p className="caption text-ink-muted">shadow-float</p>
                  </div>
                </div>
              </Card>

              <Card label="Motion">
                <dl className="flex flex-col gap-2">
                  {[
                    ["--dur-fast", "120ms", "Interactive feedback"],
                    ["--dur-base", "200ms", "List and panel entrance"],
                    ["--dur-slow", "420ms", "Ribbon draw, once only"],
                  ].map(([token, ms, use]) => (
                    <div key={token} className="flex items-baseline gap-3">
                      <dt className="caption w-28 shrink-0 text-ink-muted">
                        {token}
                      </dt>
                      <dd className="min-w-0">
                        <span className="tnum text-[0.8125rem] text-ink">
                          {ms}
                        </span>
                        <span className="caption ml-2 text-ink-muted">
                          {use}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </div>
          </Section>

          {/* ------------------------------------------ the ledger rule */}
          <Section
            n="3.1"
            title="The Ledger Rule"
            note="The signature element. A label, a tabular amount, and a hairline the amount rests on. Money never renders any other way, and a hairline never appears as decoration."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <Card label="Hero — the dashboard number">
                <LedgerRule
                  label="Wants spending"
                  amount={4280}
                  secondary="34% of ₹12,500"
                  tone="warn"
                  size="xl"
                />
                <p className="caption mt-3 text-warn">
                  4 points over your 30% line
                </p>
                <DisclaimerNote className="mt-4" />
              </Card>

              <Card label="List — the spending split">
                <LedgerList>
                  <LedgerRule label="Needs" amount={6100} secondary="49%" />
                  <LedgerRule
                    label="Wants"
                    amount={4280}
                    secondary="34%"
                    tone="warn"
                  />
                  <LedgerRule
                    label="Savings"
                    amount={2120}
                    secondary="17%"
                    tone="accent"
                  />
                </LedgerList>
              </Card>
            </div>

            <Card label="Money — every size" >
              <div className="mt-2 flex flex-wrap items-baseline gap-8">
                <Money value={108240} size="xl" />
                <Money value={4280} size="md" />
                <Money value={899} size="sm" />
                <Money value={1250.5} size="md" showPaise />
              </div>
              <p className="caption mt-4 text-ink-muted">
                en-IN grouping, never a rounded-off short form. Each carries a
                spoken label for screen readers.
              </p>
            </Card>
          </Section>

          {/* ---------------------------------------------- disclaimers */}
          <Section
            n="11"
            title="Disclaimers"
            note="One component, three variants. The wording lives in DisclaimerNote and is never retyped at a call site."
          >
            <Card>
              <div className="flex flex-col gap-3">
                <DisclaimerNote variant="advice" />
                <DisclaimerNote variant="projection" />
                <DisclaimerNote variant="synthetic" withLink={false} />
              </div>
            </Card>
          </Section>

          {/* --------------------------------------------------- states */}
          <Section
            n="7"
            title="States"
            note="Loading, empty and error are components, not afterthoughts. Skeletons match the geometry of what replaces them and never shimmer."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <Card label="Empty">
                <EmptyState
                  title="No transactions yet."
                  body="Generate a sample month to see how categorising works."
                  action={<Button>Generate a sample month</Button>}
                  className="px-0 py-2"
                />
              </Card>

              <Card label="Error">
                <ErrorState
                  title="Could not load your ledger."
                  detail="The request timed out after 5 seconds."
                  onRetry={() => undefined}
                />
                <div className="mt-4">
                  <LockedState
                    title="Growth tier is locked"
                    requirement="Unlocks when you finish Foundation and pass its quiz."
                    action={
                      <Link
                        href="/learn"
                        className="label-ui inline-flex items-center gap-1.5 text-accent underline underline-offset-2"
                      >
                        Go to the quiz
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    }
                  />
                </div>
              </Card>

              <Card label="Loading — ledger">
                <LoadingSkeleton variant="ledger" rows={3} />
              </Card>

              <Card label="Loading — card and prose">
                <LoadingSkeleton variant="card" />
                <LoadingSkeleton variant="prose" rows={3} className="mt-6" />
              </Card>
            </div>

            <Card label="Offline">
              <button
                type="button"
                onClick={() => setOffline((v) => !v)}
                className="label-ui rounded-sm text-accent underline underline-offset-2"
              >
                {offline ? "Go back online" : "Simulate going offline"}
              </button>
              <p className="caption mt-2 text-ink-muted">
                The bar renders at the top of this page, above the header.
              </p>
            </Card>
          </Section>

          {/* ------------------------------------------------ app shell */}
          <Section
            n="3.4 / 4.2"
            title="App shell"
            note="A 240px rail from lg up; a 56px top bar and 64px tab bar below it. Five tabs, in the order of the arc — Home, Learn, Ask, Money, Goals."
          >
            <Card label="Bottom tab bar at 390px">
              <div className="w-[390px] max-w-full overflow-hidden rounded-md border border-rule bg-paper">
                <ul className="flex h-16 items-stretch">
                  {[
                    ["Home", House, true],
                    ["Learn", BookOpen, false],
                    ["Ask", MessageSquare, false],
                    ["Money", Wallet, false],
                    ["Goals", Target, false],
                  ].map(([label, Icon, active]) => {
                    const I = Icon as typeof House;
                    return (
                      <li key={label as string} className="flex-1">
                        <span
                          className={`flex h-full flex-col items-center justify-center gap-1 ${
                            active ? "text-accent" : "text-ink-muted"
                          }`}
                        >
                          <I className="h-5 w-5" aria-hidden="true" />
                          <span className="caption">{label as string}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          </Section>

          {/* --------------------------------------------- shadcn bridge */}
          <Section
            n="8"
            title="Generated primitives"
            note="shadcn components read their own semantic variables, bridged onto the six tokens in globals.css. They are shown here so a regenerated primitive that smuggles in a colour is caught on this page."
          >
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Badge>Grounded</Badge>
                <Badge variant="secondary">Foundation</Badge>
                <Badge variant="outline">RBI</Badge>
              </div>
              <div className="mt-6 grid max-w-md gap-3">
                <Input placeholder="Ask about money" />
                <Progress value={62} />
              </div>
            </Card>
          </Section>
        </div>
      </div>
    </>
  );
}
