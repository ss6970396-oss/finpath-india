"use client";

import * as React from "react";
import { DisclaimerNote, MarginLayout, MarginBody, MarginNote, Money } from "@/components/ui";
import { lumpSumFutureValue } from "@/lib/finance";
import { formatINR, formatPercent } from "@/lib/format";
import { rupeesToPaise } from "@/lib/money";
import { AmountField } from "../onboarding/AmountField";
import { useFinPath } from "../providers/FinPathProvider";

/**
 * The landing page's proof: one purchase, shown as what it becomes.
 *
 * THE ARITHMETIC IS NOT HERE. `lumpSumFutureValue` is the frozen engine
 * under golden tests, and the rate and horizon are `projection_params`
 * from the API (nudge.py owns them) — the provider's fallback only until
 * the API answers. The earlier version of this component kept its own
 * copies of 12% and 10 years; that duplication is exactly what
 * `projection_params` exists to prevent (audit F-04).
 *
 * THE STARTING AMOUNT IS AN EXAMPLE AND SAYS SO. 3,500 is a plausible
 * student purchase — a pair of shoes, a weekend — prefilled so the figure
 * is there on arrival, and the field is labelled as an example the reader
 * can replace. It never appears anywhere as the reader's own data.
 *
 * The result is the section's hero figure (type-figure, through
 * <Money size="xl">). Its assumptions sit in the margin at >= 1280px and
 * inline above it below that — the marginalia system's job exactly: the
 * rule behind a computed figure.
 */

/** An example purchase, labelled as one in the field. */
const EXAMPLE_AMOUNT = 3500;

export function Diagnostic() {
  const { params } = useFinPath();
  const [amount, setAmount] = React.useState(EXAMPLE_AMOUNT);

  const years = params.years;
  const rate = params.annual_rate;
  const future = lumpSumFutureValue(amount, years, rate);

  return (
    <MarginLayout>
      <MarginNote>
        A lump sum left for {years} years at {formatPercent(rate, { digits: 0 })}{" "}
        a year, compounded yearly — FinPath&rsquo;s standard projection
        assumptions. Illustrative, not a forecast.
      </MarginNote>

      <MarginBody className="flex flex-col gap-4">
        <div className="max-w-xs">
          <AmountField
            label="An example purchase, in rupees"
            description="Change it to something you have been thinking of buying."
            value={amount}
            onValueChange={setAmount}
          />
        </div>

        <div aria-live="polite" className="flex flex-col gap-2">
          <p className="type-label text-ink-muted">
            Invested instead, in {years} years it could be
          </p>
          <p className="ledger-rule w-fit pb-2">
            <Money amount={rupeesToPaise(future)} size="xl" />
          </p>
          <p className="type-body prose-measure text-ink-secondary">
            {amount > 0
              ? `${formatINR(rupeesToPaise(amount))} spent once today is ${formatINR(rupeesToPaise(future))} you would not have in ${years} years. Nobody is saying don't buy it — only that this is what it costs.`
              : "Enter an amount to see what it becomes."}
          </p>
        </div>

        <DisclaimerNote variant="projection" />
      </MarginBody>
    </MarginLayout>
  );
}
