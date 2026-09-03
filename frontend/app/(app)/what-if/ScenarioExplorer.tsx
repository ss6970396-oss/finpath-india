"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  ButtonLink,
  ChartFrame,
  DisclaimerNote,
  Money,
  PageHeader,
  Section,
  Segmented,
  Slider,
} from "@/components/ui";
import { RULE, delayedSeries, flatSeries, stepUpSeries } from "@/lib/finance";
import { formatINR, formatPercent } from "@/lib/format";
import { rupeesToPaise } from "@/lib/money";
import { useFinPath } from "../../providers/FinPathProvider";
import { SourceLine } from "../../components/SourceLine";
import { ScenarioChart } from "./ScenarioChart";

/**
 * /what-if (§8) — "Explore scenarios".
 *
 * NOT A CALCULATOR PAGE. A calculator answers the question you already knew
 * to ask. This one opens on YOUR figures — the savings target derived from
 * your declared income, or the excess /spending handed over — and the four
 * controls exist to let you argue with them.
 *
 * THE CALCULATION LOGIC IS UNTOUCHED. `stepUpSeries`, `flatSeries` and
 * `delayedSeries` are the frozen engines from lib/finance.ts, under golden
 * tests, and the default rate and horizon still come from the API's
 * `projection_params` — which is nudge.py's, so changing the rate on the
 * server changes it here with no frontend edit. This page is a new set of
 * controls over exactly the same arithmetic.
 *
 * EVERYTHING HERE IS LABELLED ILLUSTRATIVE, in the chart frame and again
 * under the comparison. A projection at a fixed assumed rate is a piece of
 * arithmetic, not a forecast, and the difference matters most to the people
 * least likely to know it.
 */

const HORIZONS = [
  { value: "10", label: "10 years" },
  { value: "20", label: "20 years" },
  { value: "30", label: "30 years" },
] as const;

const DELAY_YEARS = 1;
const STEP_UP = 0.1;

export function ScenarioExplorer() {
  const params = useSearchParams();
  const { allowance, totals, params: projection } = useFinPath();

  // The opening position: whatever /spending handed over, else what the
  // student already sets aside, else the 20% target their income implies.
  // Never a round marketing number — the page should open on THEIR month.
  const handed = Number(params.get("monthly"));
  const opening = Math.round(
    Number.isFinite(handed) && handed > 0
      ? handed
      : (totals.Savings ?? 0) > 0
        ? (totals.Savings ?? 0)
        : allowance * RULE.savings,
  );

  const [monthly, setMonthly] = React.useState(Math.max(500, opening));
  const [stepUp, setStepUp] = React.useState(STEP_UP);
  const [rate, setRate] = React.useState(projection.annual_rate);
  const [horizon, setHorizon] = React.useState<"10" | "20" | "30">("10");

  const years = Number(horizon);

  const stepUpLine = React.useMemo(
    () => stepUpSeries(monthly, years, rate, stepUp),
    [monthly, years, rate, stepUp],
  );
  const flatLine = React.useMemo(
    () => flatSeries(monthly, years, rate),
    [monthly, years, rate],
  );
  const delayedLine = React.useMemo(
    () => delayedSeries(monthly, years, rate, DELAY_YEARS),
    [monthly, years, rate],
  );

  const end = (series: typeof flatLine) => series[series.length - 1]?.value ?? 0;
  const flatEnd = end(flatLine);
  const stepUpEnd = end(stepUpLine);
  const delayedEnd = end(delayedLine);
  const stepUpGain = stepUpEnd - flatEnd;
  const delayCost = flatEnd - delayedEnd;
  const contributed = monthly * 12 * years;

  return (
    <div className="enter flex flex-col gap-16">
      <PageHeader
        title="Explore scenarios"
        purpose="What a monthly amount becomes, what raising it each year does, and what waiting costs."
      >
        <SourceLine />
      </PageHeader>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* ------------------------------------------------- controls */}
        <form className="flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
          <fieldset className="flex flex-col gap-8">
            <legend className="type-eyebrow text-ink-muted">
              Your assumptions
            </legend>

            <Slider
              label="Invested each month"
              value={monthly}
              onValueChange={setMonthly}
              min={500}
              max={Math.max(20000, Math.round(allowance))}
              step={500}
              display={formatINR(rupeesToPaise(monthly))}
              valueText={`${formatINR(rupeesToPaise(monthly))} a month`}
              bounds={[
                formatINR(rupeesToPaise(500)),
                formatINR(rupeesToPaise(Math.max(20000, Math.round(allowance)))),
              ]}
              description="Opens on your own figure. Move it to test a different commitment."
            />

            <Slider
              label="Increase each year"
              value={Math.round(stepUp * 100)}
              onValueChange={(v) => setStepUp(v / 100)}
              min={0}
              max={25}
              step={1}
              display={formatPercent(stepUp, { digits: 0 })}
              valueText={`${Math.round(stepUp * 100)} percent a year`}
              bounds={["0%", "25%"]}
              description="A contribution that never rises is a savings rate that quietly falls in real terms."
            />

            <Slider
              label="Assumed annual return"
              value={Math.round(rate * 100)}
              onValueChange={(v) => setRate(v / 100)}
              min={4}
              max={16}
              step={1}
              display={formatPercent(rate, { digits: 0 })}
              valueText={`${Math.round(rate * 100)} percent a year`}
              bounds={["4%", "16%"]}
              description={`Defaults to the ${formatPercent(projection.annual_rate, { digits: 0 })} the server uses. Nothing guarantees any of these.`}
            />

            <div className="flex flex-col gap-2">
              <span className="type-label text-ink">Time horizon</span>
              <Segmented
                label="Time horizon"
                segments={HORIZONS}
                value={horizon}
                onValueChange={setHorizon}
              />
            </div>
          </fieldset>
        </form>

        {/* ---------------------------------------------------- chart */}
        <ChartFrame
          title="What this becomes"
          insight={insight(stepUpGain, years)}
          assumptions={`Illustrative compounding at ${formatPercent(rate, { digits: 0 })} a year, contributions at the start of each month, over ${years} years. Real returns vary, can be negative, and are not guaranteed. Tax and charges are not modelled.`}
          rowHeader="Year"
          rowLabels={stepUpLine.map((p) => String(p.year))}
          series={[
            {
              label: `Rising ${formatPercent(stepUp, { digits: 0 })} a year`,
              values: stepUpLine.map((p) => formatINR(rupeesToPaise(p.value))),
            },
            {
              label: "Same amount every year",
              values: flatLine.map((p) => formatINR(rupeesToPaise(p.value))),
            },
            {
              label: `Starting ${DELAY_YEARS} year later`,
              values: delayedLine.map((p) => formatINR(rupeesToPaise(p.value))),
            },
          ]}
        >
          <ScenarioChart
            stepUp={stepUpLine}
            flat={flatLine}
            delayed={delayedLine}
            delayYears={DELAY_YEARS}
          />
        </ChartFrame>
      </div>

      {/* ----------------------------------------------- comparison */}
      <Section
        title="The three scenarios side by side"
        description={`All three at ${formatINR(rupeesToPaise(monthly))} a month to start with, over ${years} years.`}
      >
        <dl className="grid gap-8 md:grid-cols-3">
          <Scenario
            label="Same amount every year"
            amount={flatEnd}
            note={`You would have paid in ${formatINR(rupeesToPaise(contributed))}. The rest is compounding.`}
          />
          <Scenario
            label={`Rising ${formatPercent(stepUp, { digits: 0 })} a year`}
            amount={stepUpEnd}
            note="Raising the amount as your income rises, once a year."
            emphasis
          />
          <Scenario
            label={`Starting ${DELAY_YEARS} year later`}
            amount={delayedEnd}
            note="Same amount, same return — twelve months later."
          />
        </dl>

        <div className="flex flex-col gap-4 border-t border-line pt-8">
          <p className="type-body prose-measure text-ink-secondary">
            Raising the amount by{" "}
            {formatPercent(stepUp, { digits: 0 })} each year adds{" "}
            <Money amount={rupeesToPaise(stepUpGain)} size="sm" /> over{" "}
            {years} years, without ever needing a single large decision.
            Waiting one year to begin costs{" "}
            <Money amount={rupeesToPaise(delayCost)} size="sm" /> — a gap that
            never closes, because the missing year is the one that would have
            compounded the longest.
          </p>
          <DisclaimerNote variant="projection" />
        </div>

        <div className="flex flex-wrap gap-4">
          <ButtonLink href="/plan" variant="primary">
            Set this up in my plan
          </ButtonLink>
          <ButtonLink href="/ask">Ask how to start</ButtonLink>
        </div>
      </Section>
    </div>
  );
}

function insight(stepUpGain: number, years: number): string {
  if (stepUpGain <= 0) {
    return `With no annual increase, all three lines are the same shape — the only difference over ${years} years is when you started.`;
  }
  return `The gap between the two solid lines is what a small annual increase is worth over ${years} years. It opens slowly and then does not stop.`;
}

function Scenario({
  label,
  amount,
  note,
  emphasis = false,
}: {
  label: string;
  amount: number;
  note: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="type-label text-ink-muted">{label}</dt>
      <dd className="ledger-rule pb-2">
        <Money
          amount={rupeesToPaise(amount)}
          size={emphasis ? "xl" : "lg"}
        />
      </dd>
      <dd className="type-label text-ink-muted">{note}</dd>
    </div>
  );
}
