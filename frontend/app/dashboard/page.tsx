"use client";

import Link from "next/link";
import { TrendingUp, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import HeroAnimation from "./components/HeroAnimation";

export default function Landing() {
  return (
    <main className="min-h-screen bg-slate-950">
      {/* HERO */}
      <section className="relative min-h-[92vh] overflow-hidden">
        {/* animation as the background layer */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.28]">
          <div className="w-[min(1100px,140vw)] translate-y-8">
            <HeroAnimation />
          </div>
        </div>

        {/* vignette so the type stays readable */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_5%,rgba(2,6,23,0.85)_75%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />

        {/* nav */}
        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-8 py-7">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500">
              <TrendingUp className="h-4 w-4 text-slate-950" />
            </div>
            <span className="text-sm font-extrabold uppercase tracking-[0.15em]">
              FinPath India
            </span>
          </div>
          <div className="hidden gap-9 text-sm text-slate-300 sm:flex">
            <Link href="/counselor" className="transition hover:text-emerald-400">
              Counselor
            </Link>
            <Link href="/dashboard" className="transition hover:text-emerald-400">
              Spending
            </Link>
            <a href="#how" className="transition hover:text-emerald-400">
              How it works
            </a>
          </div>
        </nav>

        {/* headline */}
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-8 pt-[14vh] text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            RBI · SEBI · NCFE grounded
          </div>

          <h1 className="text-[clamp(2.75rem,8vw,5.5rem)] font-black uppercase leading-[0.92] tracking-tight">
            Every rupee
            <br />
            <span className="text-emerald-400">has a future</span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-relaxed text-slate-400">
            An AI counselor that can only answer from verified regulatory
            documents — and a nudge engine that shows what today&apos;s spending
            costs you in ten years.
          </p>

          <Link
            href="/counselor"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-sm font-bold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-emerald-400"
          >
            Explore now <ArrowRight className="h-4 w-4" />
          </Link>

          <p className="mt-6 text-xs text-slate-600">
            Educational use only · Not investment advice
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-900">
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-slate-900">
          {[
            ["73%", "of Indian youth lack basic financial literacy"],
            ["1.8%", "Gen-Z credit card default rate"],
            ["0", "answers without a cited source"],
          ].map(([n, label]) => (
            <div key={label} className="px-6 py-10 text-center">
              <p className="text-3xl font-black tabular-nums text-emerald-400 sm:text-4xl">
                {n}
              </p>
              <p className="mx-auto mt-2 max-w-[16ch] text-xs leading-relaxed text-slate-500">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-6xl px-8 py-24">
        <h2 className="mb-3 text-center text-[clamp(1.75rem,4vw,2.75rem)] font-black uppercase tracking-tight">
          Three things it does
        </h2>
        <p className="mx-auto mb-14 max-w-md text-center text-sm text-slate-500">
          Built for students who have never had access to an advisor.
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              n: "01",
              title: "Refuses to guess",
              body: "Every answer cites an RBI, SEBI or NCFE page number. Ask something outside those documents and it says so — no hallucinated financial advice.",
            },
            {
              icon: Sparkles,
              n: "02",
              title: "Nudges, never blocks",
              body: "The rule engine spots when Wants cross 30% of your allowance, then shows the ten-year cost of that gap. You still make the call.",
            },
            {
              icon: TrendingUp,
              n: "03",
              title: "Teaches by dragging",
              body: "Move one slider and watch compounding work. Abstract maths becomes a number you can feel in your stomach.",
            },
          ].map((f) => (
            <div
              key={f.n}
              className="group rounded-2xl border border-slate-900 bg-slate-900/30 p-8 transition hover:border-emerald-500/40"
            >
              <div className="mb-5 flex items-center justify-between">
                <f.icon className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-bold tracking-widest text-slate-700">
                  {f.n}
                </span>
              </div>
              <h3 className="mb-2.5 text-lg font-bold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex justify-center gap-3">
          <Link
            href="/counselor"
            className="rounded-full bg-emerald-500 px-7 py-3 text-sm font-bold uppercase tracking-wider text-slate-950 transition hover:bg-emerald-400"
          >
            Ask the Counselor
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-7 py-3 text-sm font-bold uppercase tracking-wider text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            See the Nudge Engine
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-900 py-10 text-center text-xs text-slate-600">
        FinPath India · Suraj Pratap Singh · MVSR Engineering College, Dept. of
        CSIT
      </footer>
    </main>
  );
}