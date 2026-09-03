import Link from "next/link";
import { ArrowRight, FileText, LineChart, ListChecks, Wallet } from "lucide-react";
import {
  ButtonLink,
  DisclaimerNote,
  Money,
  ScoreDial,
  SiteFooter,
} from "@/components/ui";
import { rupees } from "@/lib/money";
import { PublicHeader } from "./components/PublicHeader";

/**
 * The landing page (§3).
 *
 * IT MUST NOT LOOK LIKE A DASHBOARD. The previous front page opened with
 * live tiles, which meant a first-time visitor met a wall of numbers about
 * nobody, framed as if it were about them. This one opens with a sentence
 * and a single CTA.
 *
 * THE PREVIEW IS LABELLED AS AN ILLUSTRATION, in text, inside the frame.
 * §28 forbids hard-coding dashboard values to make a screenshot look good,
 * and the only defensible way to show the product before someone has any
 * data is to show a specimen and say that is what it is.
 *
 * Six sections and a final CTA. No feature grid: a wall of twelve cards is
 * how a product with one clear argument ends up making none.
 */

const STEPS = [
  {
    n: "01",
    title: "Tell us your figures",
    body: "Eight short questions — what comes in, what has to go out, what you set aside, what you owe. Estimates are fine; you can change any of it later.",
  },
  {
    n: "02",
    title: "See where you actually stand",
    body: "One health score, the three ratios behind it, and the single largest thing worth changing this month.",
  },
  {
    n: "03",
    title: "Work the plan",
    body: "Four stages in the order a planner would take them, each with actions measured against your own numbers.",
  },
];

const CAPABILITIES = [
  {
    Icon: Wallet,
    title: "Spending you can argue with",
    body: "Needs, wants and savings measured against the 50/30/20 guideline, with every rupee traceable to the row it came from. Upload a bank statement and it is parsed in your browser — the file is never sent anywhere.",
    href: "/signup",
    action: "Start with your figures",
  },
  {
    Icon: LineChart,
    title: "Scenarios, not promises",
    body: "Change the monthly amount, the annual step-up, the horizon or the assumed return, and watch the curve move. Every projection states its rate and is labelled illustrative, because that is what it is.",
    href: "/signup",
    action: "Explore scenarios",
  },
  {
    Icon: ListChecks,
    title: "A plan in the right order",
    body: "Clear expensive debt, build three months of breathing room, automate investing, then let it compound. One stage is live at a time; the rest wait their turn.",
    href: "/signup",
    action: "See the stages",
  },
  {
    Icon: FileText,
    title: "Answers that cite a document",
    body: "Ask a question and the coach answers from RBI, SEBI and NCFE publications, quoting the page it read. When nothing in the corpus covers your question, it says so instead of guessing.",
    href: "/sources",
    action: "See the sources",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      <main id="main" className="flex-1">
        {/* ---------------------------------------------------------- hero */}
        <section className="page-shell grid gap-12 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="flex flex-col gap-8">
            <p className="type-eyebrow text-ink-muted">
              Financial health for students in India
            </p>

            <h1 className="type-hero text-ink">
              See where your money is going, and what to do about it.
            </h1>

            <p className="type-body prose-measure text-lg text-ink-secondary">
              FinPath turns your own monthly figures into one health score, one
              clear opportunity, and a plan with four stages. Every number
              shows the rule behind it, and every answer cites the regulator
              it came from.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <ButtonLink href="/signup" variant="primary">
                Build my financial plan
              </ButtonLink>
              <Link
                href="#how-it-works"
                className="type-label inline-flex items-center gap-1 text-ink underline underline-offset-4"
              >
                See how it works
                <ArrowRight className="lucide size-4" aria-hidden="true" />
              </Link>
            </div>

            <p className="type-label text-ink-muted">
              Free. No bank connection. Nothing is sold to you.
            </p>
          </div>

          <PreviewPanel />
        </section>

        {/* --------------------------------------------------- how it works */}
        <section
          id="how-it-works"
          className="border-t border-line bg-surface py-16"
        >
          <div className="page-shell flex flex-col gap-12">
            <div className="flex flex-col gap-2">
              <p className="type-eyebrow text-ink-muted">How FinPath works</p>
              <h2 className="type-display prose-measure text-ink">
                Three steps, and the third one is the long part.
              </h2>
            </div>

            <ol className="grid gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <li key={step.n} className="flex flex-col gap-2 border-t-2 border-line-strong pt-4">
                  <span className="type-data text-sm text-ink-muted">
                    {step.n}
                  </span>
                  <h3 className="type-heading text-ink">{step.title}</h3>
                  <p className="type-body text-ink-secondary">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------- the score */}
        <section className="page-shell grid gap-12 py-16 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-center">
          <div className="flex flex-col gap-4">
            <p className="type-eyebrow text-ink-muted">Financial health score</p>
            <h2 className="type-display prose-measure text-ink">
              One number, and you can see exactly how it was built.
            </h2>
            <p className="type-body prose-measure text-ink-secondary">
              Forty points for what you save, thirty for keeping discretionary
              spending under target, fifteen for essentials that fit, and
              fifteen for what is left unspent at the end of the month. No
              hidden weighting, no proprietary index — the arithmetic is
              printed next to the score, and you can disagree with it.
            </p>
            <p className="type-body prose-measure text-ink-secondary">
              It moves when your month moves. It is not a credit score, it is
              not shared with anyone, and it does not affect anything outside
              this product.
            </p>
          </div>

          <ul className="flex flex-col">
            {[
              ["Savings rate", "40 points", "How much of your income you keep."],
              ["Discretionary spending", "30 points", "Measured against the 30% guideline."],
              ["Essentials", "15 points", "Whether the fixed costs fit inside half."],
              ["Unspent buffer", "15 points", "What survives to the end of the month."],
            ].map(([label, weight, note]) => (
              <li
                key={label}
                className="ledger-rule flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4"
              >
                <span className="type-subhead text-ink">{label}</span>
                <span className="type-data text-ink">{weight}</span>
                <span className="type-label w-full text-ink-muted">{note}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------- capabilities */}
        <section className="border-t border-line bg-surface py-16">
          <div className="page-shell flex flex-col gap-12">
            <h2 className="type-display prose-measure text-ink">
              What you get once your figures are in.
            </h2>

            <div className="grid gap-8 md:grid-cols-2">
              {CAPABILITIES.map(({ Icon, title, body, href, action }) => (
                <section
                  key={title}
                  className="flex flex-col gap-2 border-t-2 border-line-strong pt-4"
                >
                  <Icon
                    className="lucide size-5 text-ink-secondary"
                    aria-hidden="true"
                  />
                  <h3 className="type-heading text-ink">{title}</h3>
                  <p className="type-body text-ink-secondary">{body}</p>
                  <Link
                    href={href}
                    className="type-label mt-2 inline-flex items-center gap-1 text-accent underline underline-offset-4"
                  >
                    {action}
                    <ArrowRight className="lucide size-4" aria-hidden="true" />
                  </Link>
                </section>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ trusted sources */}
        <section className="page-shell flex flex-col gap-8 py-16">
          <div className="flex flex-col gap-2">
            <p className="type-eyebrow text-ink-muted">Trusted sources</p>
            <h2 className="type-display prose-measure text-ink">
              Where the answers come from.
            </h2>
          </div>

          <p className="type-body prose-measure text-ink-secondary">
            The coach does not answer from memory. Every question is matched
            against a corpus of Reserve Bank of India, SEBI and National
            Centre for Financial Education publications, and the answer quotes
            the passages it used with the document and page number attached.
            When nothing in the corpus is close enough, the answer is marked
            as coming from general knowledge instead — and when the corpus is
            unreachable, it refuses rather than improvising.
          </p>

          <div className="flex flex-wrap gap-4">
            <ButtonLink href="/sources">Read the methodology</ButtonLink>
            <ButtonLink href="/signup" variant="primary">
              Ask your first question
            </ButtonLink>
          </div>
        </section>

        {/* --------------------------------------------------- final CTA */}
        <section className="border-t border-line bg-surface py-16">
          <div className="page-shell flex flex-col items-start gap-8">
            <h2 className="type-display prose-measure text-ink">
              Ten minutes now, and you will know what your money is doing.
            </h2>
            <ButtonLink href="/signup" variant="primary">
              Build my financial plan
            </ButtonLink>
            <DisclaimerNote />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * The product preview.
 *
 * A specimen, not a screenshot and not live data. The figures below are a
 * worked example at a plausible student scale, and the frame says so in
 * words directly above them — an unlabelled preview is indistinguishable
 * from a claim about the reader.
 */
function PreviewPanel() {
  return (
    <figure className="flex flex-col gap-4 border border-line bg-surface px-4 py-8">
      <figcaption className="type-eyebrow text-ink-muted">
        Illustration — a worked example, not real data
      </figcaption>

      <ScoreDial
        score={62}
        band="Steady, with one thing to fix"
        caption="Savings are on target. Discretionary spending is over the 30% line."
      />

      <dl className="flex flex-col">
        {[
          ["Money in", rupees(24000), "Stipend and allowance"],
          ["Essentials", rupees(11400), "48% — inside the guideline"],
          ["Discretionary", rupees(8600), "36% — above the 30% target"],
          ["Set aside", rupees(4000), "17% — just under target"],
        ].map(([label, amount, note]) => (
          <div
            key={label as string}
            className="ledger-rule flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2"
          >
            <dt className="type-label text-ink">{label as string}</dt>
            <dd>
              <Money amount={amount as ReturnType<typeof rupees>} size="md" />
            </dd>
            <dd className="type-label w-full text-ink-muted">
              {note as string}
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
