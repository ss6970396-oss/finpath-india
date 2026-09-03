"use client";

import * as React from "react";
import {
  ButtonLink,
  ButtonRow,
  DisclaimerNote,
  DistributionBar,
  Insight,
  Money,
  PageHeader,
  Section,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type Slice,
} from "@/components/ui";
import { RULE, variance } from "@/lib/finance";
import { formatPercent } from "@/lib/format";
import { rupeesToPaise } from "@/lib/money";
import { useFinPath } from "../../providers/FinPathProvider";
import { SourceLine } from "../../components/SourceLine";
import { StatementImport } from "./StatementImport";

/**
 * /spending (§7).
 *
 * NOT FOUR IDENTICAL CARDS. The page is an argument in four moves:
 * where the money went, which line is off target, what to do about it, and
 * — behind a tab — the ledger it was all read from.
 *
 * THE DISTRIBUTION IS THE ONLY CHART. One stacked band, with the legend
 * doubling as the data table, replaces the ring of coloured tiles. §18 asks
 * for one insight at a time and this is the one: the shape of the month.
 *
 * "RECOMMENDED ADJUSTMENT" HAS TO GO SOMEWHERE. An adjustment with no
 * destination is a scolding, so the excess is handed straight to the
 * scenario explorer as a monthly amount — the student sees what the money
 * they are already spending would become, which is the only argument that
 * has ever changed anyone's spending.
 */
export default function SpendingPage() {
  const { allowance, totals, ratio, source, uploaded, income } = useFinPath();

  const v = variance(ratio);
  const wantsTarget = allowance * RULE.wants;
  const wantsExcess = Math.max(0, (totals.Wants ?? 0) - wantsTarget);
  const uncategorisedTotal = totals.Uncategorised ?? 0;

  const slices: Slice[] = [
    {
      key: "Needs",
      label: "Essentials",
      value: totals.Needs ?? 0,
      display: <Money amount={rupeesToPaise(totals.Needs ?? 0)} size="sm" />,
      flagged: v.Needs > 0,
      note: "Rent, food, transport, fees — the costs that arrive whether or not you think about them.",
    },
    {
      key: "Wants",
      label: "Discretionary",
      value: totals.Wants ?? 0,
      display: <Money amount={rupeesToPaise(totals.Wants ?? 0)} size="sm" />,
      flagged: v.Wants > 0,
      note: "Eating out, shopping, subscriptions, travel. The part you decide each month.",
    },
    {
      key: "Savings",
      label: "Set aside",
      value: totals.Savings ?? 0,
      display: <Money amount={rupeesToPaise(totals.Savings ?? 0)} size="sm" />,
      note: "Money moved out to savings or investments.",
    },
    ...(uncategorisedTotal > 0
      ? [
          {
            key: "Uncategorised",
            label: "Not yet placed",
            value: uncategorisedTotal,
            display: (
              <Money amount={rupeesToPaise(uncategorisedTotal)} size="sm" />
            ),
            note: "Left out of the three ratios until you place it, but still counted as money that left the account.",
          } satisfies Slice,
        ]
      : []),
  ];

  const offTrack = [
    { label: "Essentials", ratio: ratio.Needs, target: RULE.needs, over: v.Needs },
    { label: "Discretionary", ratio: ratio.Wants, target: RULE.wants, over: v.Wants },
    { label: "Savings", ratio: ratio.Savings, target: RULE.savings, over: -v.Savings },
  ].filter((row) => row.over > 0.001);

  return (
    <div className="enter flex flex-col gap-16">
      <PageHeader
        title="Spending"
        purpose="Where this month's money went, measured against the 50/30/20 guideline."
      >
        <SourceLine />
      </PageHeader>

      <Section
        title="Where the money went"
        description="Each share is measured against your monthly income, which is the denominator the guideline uses."
      >
        <DistributionBar slices={slices} total={allowance} />
        {income > 0 ? (
          <p className="type-label text-ink-muted">
            <Money amount={rupeesToPaise(income)} size="sm" tone="muted" /> also
            arrived in the account this month. Credits are never counted as
            spending, so they do not appear above.
          </p>
        ) : null}
      </Section>

      <Section
        title="Where you are off track"
        description="Measured against the guideline, not against other people."
      >
        {offTrack.length === 0 ? (
          <p className="type-body prose-measure text-ink-secondary">
            Nothing is outside its guideline this month. Essentials fit inside
            half your income, discretionary spending is under the 30% line, and
            you are saving at or above 20%.
          </p>
        ) : (
          <ul className="flex flex-col">
            {offTrack.map((row) => (
              <li
                key={row.label}
                className="ledger-rule flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4"
              >
                <span className="type-subhead text-ink">{row.label}</span>
                <span className="type-data text-ink">
                  {formatPercent(row.ratio, { digits: 0 })}
                </span>
                <span className="type-label w-full text-ink-muted">
                  {row.label === "Savings"
                    ? `Below the ${formatPercent(row.target, { digits: 0 })} target by ${formatPercent(row.over, { digits: 0 })} of your income.`
                    : `Above the ${formatPercent(row.target, { digits: 0 })} target by ${formatPercent(row.over, { digits: 0 })} of your income.`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {wantsExcess > 0 ? (
        <Insight
          eyebrow="Recommended adjustment"
          title="Bring discretionary spending back to the line"
          tone="critical"
          amount={<Money amount={rupeesToPaise(wantsExcess)} size="xl" />}
          amountLabel={
            "The amount above your target. Redirecting it needs no extra income."
          }
          detail={`Your target is ${formatPercent(RULE.wants, { digits: 0 })} of income. Cutting back to it frees this much every month — the scenario explorer will show what that becomes if it is invested instead.`}
          action={
            <>
              <ButtonLink
                href={`/what-if?monthly=${Math.round(wantsExcess)}`}
                variant="primary"
              >
                See what it becomes
              </ButtonLink>
              <ButtonLink href="/plan">Apply to my plan</ButtonLink>
            </>
          }
        />
      ) : (
        <Insight
          eyebrow="Recommended adjustment"
          title="Nothing needs cutting this month"
          tone="positive"
          detail="Discretionary spending is inside its target. The useful work now is holding it there as your income rises, which is where this usually slips."
          action={<ButtonLink href="/what-if">Explore scenarios</ButtonLink>}
        />
      )}

      <Section
        title="The ledger"
        description="Every row this page was built from, and the file it came from."
      >
        <Tabs defaultValue="import" label="Spending detail">
          <TabList>
            <Tab value="import">Statement</Tab>
            <Tab value="method">How this is calculated</Tab>
          </TabList>

          <TabPanel value="import">
            {source === "declared" && !uploaded ? (
              <p className="type-body prose-measure mb-4 text-ink-secondary">
                The figures above are the ones you entered during setup.
                Uploading a bank statement replaces them with what actually
                happened — and the file is parsed here, in your browser.
              </p>
            ) : null}
            <StatementImport />
          </TabPanel>

          <TabPanel value="method">
            <div className="prose-measure flex flex-col gap-4">
              <p className="type-body text-ink-secondary">
                Every share on this page is a fraction of your monthly income,
                which is the denominator the 50/30/20 guideline uses. Money
                arriving in the account is excluded from every bucket — an
                allowance credit counted as spending would halve every ratio
                and stop the guideline meaning anything.
              </p>
              <p className="type-body text-ink-secondary">
                Rows whose merchant is not in the classification table are held
                in &ldquo;not yet placed&rdquo; rather than assumed to be
                discretionary. They are excluded from the three ratios and
                included in what has left your account, because both of those
                are true at once.
              </p>
              <p className="type-body text-ink-secondary">
                The guideline itself is a widely used heuristic, not a
                regulation. It is a reasonable starting point and a bad
                straitjacket: a student paying city rent will exceed 50% on
                essentials and there may be nothing wrong with that.
              </p>
              <ButtonRow align="start">
                <ButtonLink href="/sources">Read the methodology</ButtonLink>
              </ButtonRow>
            </div>
          </TabPanel>
        </Tabs>
      </Section>

      <DisclaimerNote />
    </div>
  );
}
