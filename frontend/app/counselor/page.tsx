"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, ShieldCheck, User, Lock, Sparkles } from "lucide-react";
import CitationInspector, { type Src } from "../components/CitationInspector";
import { Card, Figure, Label, Pill } from "../components/ui";
import { API } from "../providers/FinPathProvider";
import { metaFor } from "@/lib/corpus";

type Msg = { role: "user" | "ai"; text: string; sources?: Src[] };

const CHIPS = [
  "Credit Card Minimum Due Trap",
  "Emergency Fund Sizing Rules",
  "SIP vs Lumpsum Mechanics",
  "Tax Saving Under 80C / 80D",
  "Health Insurance Deductibles",
];

/**
 * Renders the model's plain text as structured blocks. The system prompt
 * forbids markdown headings and emoji, so this only has to handle paragraphs
 * and the bullet/numbered lists the model does produce.
 */
function Structured({ text }: { text: string }) {
  const blocks: { type: "p" | "ul"; lines: string[] }[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = /^([-*•]|\d+[.)])\s+/.test(line);
    const last = blocks[blocks.length - 1];

    if (bullet) {
      const content = line.replace(/^([-*•]|\d+[.)])\s+/, "");
      if (last?.type === "ul") last.lines.push(content);
      else blocks.push({ type: "ul", lines: [content] });
    } else if (last?.type === "p") {
      last.lines.push(line);
    } else {
      blocks.push({ type: "p", lines: [line] });
    }
  }

  return (
    <>
      {blocks.map((b, i) =>
        b.type === "ul" ? (
          <ul key={i} className="my-2 space-y-1.5 pl-1">
            {b.lines.map((l, j) => (
              <li key={j} className="flex gap-2.5 text-[13px] leading-relaxed">
                <span
                  aria-hidden="true"
                  className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-forest"
                />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="my-1.5 text-[13px] leading-relaxed first:mt-0">
            {b.lines.join(" ")}
          </p>
        ),
      )}
    </>
  );
}

function CounselorWorkspace() {
  const params = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeN, setActiveN] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const sentPreset = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (preset?: string) => {
      const question = (preset ?? input).trim();
      if (!question || loading) return;
      setInput("");
      setLoading(true);

      setMessages((m) => [
        ...m,
        { role: "user", text: question },
        { role: "ai", text: "" },
      ]);

      try {
        const res = await fetch(`${API}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question }),
        });

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const [body, meta] = acc.split("␟SOURCES␟");
          const snapshot = body;
          let srcs: Src[] | undefined;
          try {
            srcs = meta ? (JSON.parse(meta) as Src[]) : undefined;
          } catch {
            srcs = undefined;
          }
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = {
              role: "ai",
              text: snapshot,
              sources: srcs,
            };
            return copy;
          });
          if (srcs?.length) setActiveN(srcs[0].n);
        }
      } catch {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "ai",
            text: "Could not reach the API on port 8000. Start it with `fastapi dev main.py` from the backend directory.",
          };
          return copy;
        });
      } finally {
        setLoading(false);
      }
    },
    [input, loading],
  );

  // A ?q= link from the command palette asks its question once.
  useEffect(() => {
    const q = params.get("q");
    if (q && !sentPreset.current) {
      sentPreset.current = true;
      send(q);
    }
  }, [params, send]);

  const lastSources =
    [...messages].reverse().find((m) => m.sources?.length)?.sources ?? [];

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-5 py-8">
      <header>
        <Label>Consult · AI Counselor</Label>
        <h1 className="mt-1.5 font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight tracking-tight text-ink">
          Ask
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-meta">
          Retrieval runs before generation. The model sees only the passages
          returned by the index, and every passage it was given is shown on the
          left for inspection.
        </p>
      </header>

      <div className="mt-6 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* LEFT — inspector */}
        <Card className="order-2 max-h-[720px] overflow-hidden lg:order-1">
          <CitationInspector
            sources={lastSources}
            activeN={activeN}
            onSelect={setActiveN}
          />
        </Card>

        {/* RIGHT — chat console */}
        <Card className="order-1 flex max-h-[720px] min-h-[520px] flex-col overflow-hidden lg:order-2">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <Label>Conversation</Label>
            <Pill tone="sage">
              <Lock className="h-3 w-3" />
              Answers restricted to official regulatory documents
            </Pill>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-sage-line bg-sage">
                  <Sparkles className="h-4 w-4 text-sage-ink" />
                </span>
                <h2 className="mt-4 font-display text-2xl leading-tight tracking-tight text-ink">
                  Ask a grounded question
                </h2>
                <p className="mt-2 max-w-md text-[13px] leading-relaxed text-meta">
                  Answers are drawn only from the indexed RBI, SEBI and NCFE
                  publications. Where the corpus offers no support, the
                  counselor declines rather than estimating.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                  {CHIPS.map((c) => (
                    <button
                      key={c}
                      onClick={() => send(c)}
                      className="rounded-md border border-line bg-surface px-3 py-1.5 text-[12px] text-ink-2 transition hover:border-forest hover:bg-sage hover:text-sage-ink"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((m, i) => {
                  const streaming =
                    m.role === "ai" && loading && i === messages.length - 1;
                  return (
                    <div key={i} className="flex gap-3">
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border ${
                          m.role === "ai"
                            ? "border-forest bg-forest"
                            : "border-line bg-surface-2"
                        }`}
                      >
                        {m.role === "ai" ? (
                          <ShieldCheck className="h-3.5 w-3.5 text-on-forest" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-meta" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-meta">
                          {m.role === "ai" ? "Counselor" : "You"}
                        </p>

                        <div
                          className={`mt-1.5 text-ink-2 ${
                            streaming ? "caret-stream" : ""
                          }`}
                        >
                          {m.role === "ai" ? (
                            <Structured text={m.text} />
                          ) : (
                            <p className="text-[13px] leading-relaxed text-ink">
                              {m.text}
                            </p>
                          )}
                        </div>

                        {m.sources && m.sources.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                            {m.sources.map((s) => {
                              const meta = metaFor(s.source);
                              return (
                                <button
                                  key={s.n}
                                  onClick={() => setActiveN(s.n)}
                                  aria-pressed={activeN === s.n}
                                  className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition ${
                                    activeN === s.n
                                      ? "border-sage-line bg-sage text-sage-ink"
                                      : "border-line bg-surface text-meta hover:border-line-strong hover:text-ink"
                                  }`}
                                >
                                  <Figure className="font-medium">
                                    [{s.n}]
                                  </Figure>
                                  {meta.issuer} · {meta.title}
                                  <Figure>, p.{s.page}</Figure>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-line px-5 py-4">
            {messages.length > 0 && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {CHIPS.slice(0, 3).map((c) => (
                  <button
                    key={c}
                    onClick={() => send(c)}
                    disabled={loading}
                    className="rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] text-meta transition hover:border-forest hover:text-ink disabled:opacity-45"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-md border border-line bg-surface-2 px-3 py-1.5 focus-within:border-forest">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about SIPs, credit cards, emergency funds, tax"
                aria-label="Question for the counselor"
                className="w-full bg-transparent py-1.5 text-[13px] text-ink outline-none placeholder:text-meta"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded bg-forest px-3 py-1.5 text-[12px] font-medium text-on-forest transition hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? "Retrieving" : "Send"}
                <Send className="h-3 w-3" />
              </button>
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-meta">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              Answers restricted exclusively to official regulatory documents.
              Educational use only; not investment advice.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default function Counselor() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-8">
          <p className="text-[13px] text-meta">Loading workspace…</p>
        </main>
      }
    >
      <CounselorWorkspace />
    </Suspense>
  );
}
