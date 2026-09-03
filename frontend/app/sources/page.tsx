"use client";

import * as React from "react";
import {
  Badge,
  Button,
  ButtonLink,
  DisclaimerNote,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Section,
  SiteFooter,
} from "@/components/ui";
import { apiJson, describeApiFailure } from "@/lib/api";
import { prettySource } from "@/lib/format";
import { API } from "../providers/FinPathProvider";
import { PublicHeader } from "../components/PublicHeader";

/**
 * /sources (§9, §25) — trusted sources and methodology.
 *
 * WHAT THIS PAGE DELIBERATELY DOES NOT SHOW. The API returns chunk counts
 * and an index-ready flag, and neither appears here. "1,284 chunks indexed"
 * is a fact about a vector store; the reader's question is "can this thing
 * answer me from a real document, or not", and that is what is rendered.
 * §25 is explicit that retrieval internals are hidden from normal users.
 *
 * The methodology section is the other half of the same promise: every
 * figure elsewhere in the product states its rule inline, and this is where
 * those rules are collected and the guideline behind them is named as a
 * heuristic rather than a law.
 */

type SourceDoc = {
  file: string;
  bytes: number | null;
  chunks: number;
  indexed: boolean;
};

type SourcesResponse = {
  documents: SourceDoc[];
  total_chunks: number;
  index_ready: boolean;
};

const RULES = [
  {
    title: "The 50/30/20 guideline",
    body: "Essentials at up to half your income, discretionary spending at up to 30%, and at least 20% set aside. It is a widely used rule of thumb, not a regulation, and it is a poor fit for anyone paying city rent on a student income — which is why the product shows the gap rather than a pass or a fail.",
  },
  {
    title: "The health score",
    body: "Forty points for the savings rate against the 20% target, thirty for discretionary spending against the 30% ceiling, fifteen for essentials against the 50% ceiling, and fifteen for what is left unspent. Each part degrades linearly to zero at twice its target, so the score moves smoothly instead of falling off a cliff.",
  },
  {
    title: "Uncategorised spending",
    body: "A transaction whose merchant is not recognised is held apart rather than assumed to be discretionary. It is excluded from the three ratios — the guideline should measure your spending, not the parser's ignorance — and included in what has left your account, because it did.",
  },
  {
    title: "Projections",
    body: "Compound growth on contributions made at the start of each month, at a fixed assumed annual rate you can change. No tax, no charges, no inflation adjustment, and no claim that any rate will be achieved. Every projection in the product is labelled illustrative.",
  },
  {
    title: "The emergency buffer",
    body: "Three months of your declared essentials. Where you have not declared a balance, the plan reads cumulative savings as a proxy and says so on the stage itself rather than presenting the bar without its source.",
  },
];

type Result =
  | { key: number; kind: "ready"; data: SourcesResponse }
  | { key: number; kind: "error"; message: string };

export default function SourcesPage() {
  const [nonce, setNonce] = React.useState(0);
  const [result, setResult] = React.useState<Result | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const key = nonce;
    const url = `${API}/api/sources`;
    apiJson<SourcesResponse>(url)
      .then((data) => {
        if (!cancelled) setResult({ key, kind: "ready", data });
      })
      .catch(async (err) => {
        const message = await describeApiFailure(err, url);
        if (!cancelled) setResult({ key, kind: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  // Loading is DERIVED from whether the answer in hand belongs to the
  // request in flight, rather than assigned by the effect. Setting state at
  // the top of an effect body costs a cascading render on every retry, and
  // the lint rule that catches it is right to.
  const state: Result | { kind: "loading" } =
    result && result.key === nonce ? result : { kind: "loading" };

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      <main id="main" className="page-shell w-full flex-1 py-8">
        <div className="flex flex-col gap-16">
          <PageHeader
            title="Trusted sources"
            purpose="The documents your coach reads, and the rules behind every figure in the product."
          />

          <Section
            title="The library"
            description="Publications from the Reserve Bank of India, SEBI and the National Centre for Financial Education."
          >
            {state.kind === "loading" ? (
              <LoadingState label="Loading the source library" lines={5} />
            ) : state.kind === "error" ? (
              <ErrorState
                title="The source library could not be loaded"
                detail={state.message}
                onRetry={
                  <Button onClick={() => setNonce((n) => n + 1)}>Try again</Button>
                }
              />
            ) : state.data.documents.length === 0 ? (
              <EmptyState
                title="No documents are loaded yet"
                description="The coach answers from a corpus of regulator publications. Until one is loaded it will say so rather than answering from general knowledge unchecked."
                action={<ButtonLink href="/ask">Ask a question anyway</ButtonLink>}
              />
            ) : (
              <ul className="flex flex-col">
                {state.data.documents.map((doc) => (
                  <li
                    key={doc.file}
                    className="ledger-rule flex flex-wrap items-baseline justify-between gap-4 py-4"
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="type-subhead text-ink">
                        {prettySource(doc.file)}
                      </span>
                      <span className="type-label text-ink-muted">
                        {doc.file}
                      </span>
                    </span>
                    {doc.indexed ? (
                      <Badge tone="positive">Available to your coach</Badge>
                    ) : (
                      <Badge tone="neutral">Not yet loaded</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="How an answer is put together"
            description="The same steps every time, in the same order."
          >
            <ol className="flex flex-col">
              {[
                [
                  "Your question is matched against the library",
                  "Not against the whole internet, and not against the model's memory. The passages closest in meaning to your question are retrieved first.",
                ],
                [
                  "The answer is written only from those passages",
                  "The model is instructed to use nothing else and to attach a numbered marker to each claim. Those markers are the buttons in the answer, and each one opens the passage verbatim.",
                ],
                [
                  "If nothing is close enough, it says so",
                  "An answer the library cannot support is badged as coming from general knowledge and carries no citations at all — because a citation that does not support the sentence is worse than none.",
                ],
                [
                  "If the library is unreachable, it refuses",
                  "An outage is not the same as a question the corpus does not cover. The coach declines rather than quietly improvising.",
                ],
              ].map(([title, body], i) => (
                <li key={title} className="ledger-rule flex gap-4 py-4">
                  <span className="type-data shrink-0 text-sm text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="type-subhead text-ink">{title}</span>
                    <span className="type-body prose-measure text-ink-secondary">
                      {body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Section>

          <Section
            id="method"
            title="How every figure is calculated"
            description="Each rule is also printed beside the figure it produces."
          >
            <ul className="flex flex-col">
              {RULES.map((rule) => (
                <li key={rule.title} className="ledger-rule flex flex-col gap-1 py-4">
                  <span className="type-subhead text-ink">{rule.title}</span>
                  <span className="type-body prose-measure text-ink-secondary">
                    {rule.body}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title="What FinPath will not do"
            description="The boundaries are as much a part of the method as the arithmetic."
          >
            <ul className="prose-measure flex list-disc flex-col gap-2 pl-4">
              {[
                "Name a stock, a fund, a scheme or any other specific product.",
                "Tell you what to buy, or when.",
                "Connect to your bank, hold money, or move it.",
                "Present a projection as a forecast, or a rate as a promise.",
                "Answer a question the library cannot support without saying so.",
              ].map((item) => (
                <li key={item} className="type-body text-ink-secondary">
                  {item}
                </li>
              ))}
            </ul>
            <DisclaimerNote />
          </Section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
