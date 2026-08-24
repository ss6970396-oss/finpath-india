"use client";

import Link from "next/link";
import {
  ArrowRight, BookMarked, FileText, Gauge, LineChart, ShieldCheck,
} from "lucide-react";
import ImpulseDiagnostic from "./components/ImpulseDiagnostic";
import { Card, Figure, Label, Pill } from "./components/ui";

const TRUST = [
  {
    body: "RBI",
    label: "Master Directions & investor education",
    href: "https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx",
  },
  {
    body: "SEBI",
    label: "Investor awareness & education",
    href: "https://investor.sebi.gov.in/",
  },
  {
    body: "NCFE",
    label: "National financial education standards",
    href: "https://www.ncfe.org.in/",
  },
];

const PILLARS = [
  {
    icon: ShieldCheck,
    kicker: "Grounding",
    title: "Zero-hallucination regulatory grounding",
    body: "Retrieval runs before generation. The counselor sees only the passages the index returned, cites the document and page behind every claim, and declines outright when the corpus has no support.",
    foot: "Citation viewer with verbatim clause text",
    href: "/counselor",
  },
  {
    icon: Gauge,
    kicker: "Behaviour",
    title: "Behavioural nudges over restrictions",
    body: "Nothing is blocked and nothing is scolded. A ratio that breaches the 50/30/20 line is restated as the future value it displaces, so the trade-off becomes legible rather than moralised.",
    foot: "Health score, variance flags, guilt-free allowance",
    href: "/spending",
  },
  {
    icon: LineChart,
    kicker: "Simulation",
    title: "Tactile wealth simulations",
    body: "Step-up contributions, the cost of a late start, lifestyle creep against financial-independence age, and a liquidity runway measured in days — each recomputed as you move a control.",
    foot: "Recharts models, no jargon",
    href: "/simulator",
  },
];

export default function Landing() {
  return (
    <main>
      {/* HERO */}
      <section className="border-b border-rule bg-paper">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 lg:grid-cols-[1.1fr_minmax(0,460px)] lg:gap-14 lg:py-20">
          <div>
            <Pill tone="positive">
              <ShieldCheck className="h-3 w-3" />
              Retrieval-grounded · citation-enforced
            </Pill>

            <h1 className="mt-5 font-display text-[clamp(2.75rem,6vw,4.25rem)] leading-[1.02] tracking-tight text-ink">
              Every rupee has a future.
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink">
              FinPath India pairs a retrieval-augmented counselor — constrained
              to official RBI, SEBI and NCFE publications, and required to cite
              a page for every claim — with a behavioural nudge engine that
              converts today&apos;s spending ratios into the compounded value
              they displace. Diagnose, simulate, consult, then act.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link
                href="/spending"
                className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-accent"
              >
                Run the diagnosis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/counselor"
                className="inline-flex items-center gap-2 rounded-md border border-rule bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-rule hover:bg-surface"
              >
                Open the counselor
              </Link>
            </div>

            <div className="mt-9">
              <Label>Source authorities</Label>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {TRUST.map((t) => (
                  <a
                    key={t.body}
                    href={t.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2.5 rounded-md border border-rule bg-surface px-3 py-2 transition hover:border-rule hover:bg-surface"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded border border-rule bg-accent-weak text-[10px] font-semibold text-accent">
                      {t.body === "RBI" ? "RB" : t.body === "SEBI" ? "SE" : "NC"}
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[12px] font-medium text-ink">
                        {t.body}
                      </span>
                      <span className="block text-[11px] text-ink-muted">
                        {t.label}
                      </span>
                    </span>
                    <ArrowRight className="h-3 w-3 text-ink-muted transition group-hover:translate-x-0.5" />
                  </a>
                ))}
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-ink-muted">
                Links open the issuing authority&apos;s own portal. The
                counselor cites only the documents held in the indexed corpus —
                see the{" "}
                <Link href="/vault" className="underline underline-offset-2">
                  Regulatory Vault
                </Link>{" "}
                for exactly what is searchable.
              </p>
            </div>
          </div>

          <ImpulseDiagnostic />
        </div>
      </section>

      {/* PILLARS */}
      <section className="mx-auto max-w-[1400px] px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-tight tracking-tight text-ink">
              Three pillars
            </h2>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-ink-muted">
              Built for students who have never had access to an adviser, and
              held to the standard of one.
            </p>
          </div>
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink underline-offset-4 hover:underline"
          >
            See the milestone ladder <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Card
              key={p.title}
              as="article"
              className="flex flex-col transition hover:border-rule"
            >
              <div className="flex items-center justify-between border-b border-rule px-5 py-3.5">
                <span className="flex items-center gap-2">
                  <p.icon className="h-4 w-4 text-accent" />
                  <Label>{p.kicker}</Label>
                </span>
                <Figure className="text-[11px] text-ink-muted">
                  {String(i + 1).padStart(2, "0")}
                </Figure>
              </div>

              <div className="flex flex-1 flex-col px-5 py-5">
                <h3 className="font-display text-xl leading-snug tracking-tight text-ink">
                  {p.title}
                </h3>
                <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-ink-muted">
                  {p.body}
                </p>
                <Link
                  href={p.href}
                  className="mt-5 inline-flex items-center gap-1.5 border-t border-rule pt-3.5 text-[12px] font-medium text-ink transition hover:gap-2.5"
                >
                  <FileText className="h-3.5 w-3.5 text-ink-muted" />
                  {p.foot}
                  <ArrowRight className="ml-auto h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FLOW */}
      <section className="border-y border-rule bg-paper">
        <div className="mx-auto max-w-[1400px] px-5 py-12">
          <Label>The flow</Label>
          <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-4">
            {[
              ["Diagnose", "Spending Engine", "/spending", "Score the month against 50/30/20."],
              ["Simulate", "Nudge Simulator", "/simulator", "Model step-ups, delay and shocks."],
              ["Consult", "AI Counselor", "/counselor", "Ask, and get a cited answer."],
              ["Act", "Roadmap", "/roadmap", "Work the milestone ladder."],
            ].map(([step, name, href, body], i) => (
              <Link
                key={step}
                href={href}
                className="group bg-surface px-5 py-5 transition hover:bg-surface"
              >
                <Figure className="text-[11px] text-ink-muted">
                  0{i + 1}
                </Figure>
                <p className="mt-1.5 font-display text-lg tracking-tight text-ink">
                  {step}
                </p>
                <p className="mt-0.5 text-[12px] font-medium text-accent">
                  {name}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
                  {body}
                </p>
              </Link>
            ))}
          </div>

          <p className="mt-5 flex items-center gap-2 text-[12px] text-ink-muted">
            <BookMarked className="h-3.5 w-3.5" />
            Press{" "}
            <kbd className="figure rounded border border-rule bg-surface px-1.5 py-0.5 text-[10px]">
              ⌘K
            </kbd>{" "}
            anywhere to search citations, calculators and tools.
          </p>
        </div>
      </section>
    </main>
  );
}
