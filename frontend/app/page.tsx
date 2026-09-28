import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DisclaimerNote,
  SectionLabel,
  SiteFooter,
  TRUST_LINE,
} from "@/components/ui";
import { Diagnostic } from "./components/Diagnostic";
import { HeroCta } from "./components/HeroCta";
import { FooterAccount } from "./components/FooterAccount";
import { PublicHeader } from "./components/PublicHeader";

/**
 * The landing page (§3) — a server component with two small client
 * islands (the session-aware CTA and the diagnostic).
 *
 * A QUIET LIBRARY, NOT A SHOP. Three things, separated by whitespace and a
 * hairline, and nothing else:
 *
 *   1. the promise, set large with wide margins of empty paper, and ONE
 *      primary action (plus one text link)
 *   2. the proof: one purchase shown as what it becomes, with its
 *      assumptions in the margin
 *   3. the trust line: where answers come from, and that FinPath sells
 *      nothing
 *
 * The specimen dashboard, the three-step explainer, the score weights and
 * the capability grid are gone from here. Their substance already lives on
 * /sources (the method) and in the product itself; on a landing page they
 * were decoration arguing with the one sentence that matters.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      <main id="main" className="flex-1">
        {/* ---------------------------------------------------------- hero */}
        <section className="page-shell flex flex-col gap-8 py-24 lg:py-32">
          <h1 className="type-hero text-ink">
            <span className="block">Your money.</span>
            <span className="block">One clear next step.</span>
          </h1>

          <p className="type-reading prose-measure text-ink-secondary">
            FinPath reads your own monthly figures, finds the one thing worth
            doing next, and shows you where every answer comes from.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <HeroCta />
            <Link
              href="/sources"
              className="type-label inline-flex min-h-11 items-center gap-1 text-accent underline underline-offset-4 hover:text-ink"
            >
              How answers are sourced
              <ArrowRight className="lucide size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ----------------------------------------------------- the proof */}
        <section
          aria-labelledby="diagnostic-heading"
          className="page-shell flex flex-col gap-8 border-t border-line py-16"
        >
          <div className="flex flex-col gap-2">
            <SectionLabel as="p">What one purchase becomes</SectionLabel>
            <h2 id="diagnostic-heading" className="type-heading prose-measure text-ink">
              Every rupee has a second life you do not see at the till.
            </h2>
          </div>
          <Diagnostic />
        </section>

        {/* ------------------------------------------------- trust line */}
        <section className="page-shell flex flex-col gap-4 border-t border-line py-16">
          <SectionLabel as="p">Where answers come from</SectionLabel>
          <p className="type-reading prose-measure text-ink">{TRUST_LINE}</p>
          <DisclaimerNote />
        </section>
      </main>

      <SiteFooter account={<FooterAccount />} />
    </div>
  );
}
