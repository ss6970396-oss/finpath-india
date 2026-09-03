"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUp } from "lucide-react";
import {
  Badge,
  Button,
  ButtonLink,
  Citation,
  DisclaimerNote,
  ErrorState,
  PageHeader,
  Sheet,
  SourcePanel,
  UnverifiedNote,
  type SourceEntry,
} from "@/components/ui";
import { apiFetch, describeApiFailure } from "@/lib/api";
import { prettySource } from "@/lib/format";
import { API } from "../../providers/FinPathProvider";

/**
 * /ask (§9) — the financial coach.
 *
 * NOT A CHATGPT CLONE, and the difference is structural rather than
 * cosmetic. Three things this screen does that a generic chat UI does not:
 *
 *   1. IT OPENS WITH QUESTIONS, not an empty box. A blank prompt is the
 *      hardest possible starting point for someone who does not yet know
 *      the vocabulary — which is precisely the reader this product is for.
 *   2. EVERY CLAIM CARRIES ITS SOURCE. The `[1]` markers in the model's
 *      text become real buttons that open the passage they came from, and
 *      the passage is quoted verbatim, never paraphrased.
 *   3. IT ADMITS WHEN IT IS NOT GROUNDED. An answer the corpus could not
 *      cover is badged, in words, and carries no citations at all — the
 *      absence of chips is not something a reader notices.
 *
 * THE STREAMING CONTRACT IS SHARED WITH THE BACKEND AND BOTH ENDS CHANGE
 * TOGETHER: the body is the answer text, then "\n␟SOURCES␟", then JSON of
 * `{mode, top_distance, sources}`. `SOURCES_DELIM` and `_meta_payload()` in
 * backend/main.py are the other half. A bare array tail is still accepted
 * for compatibility with the older shape.
 */

const DELIM = "\n␟SOURCES␟";

/** Long, because a grounded answer streams for a while. */
const CHAT_TIMEOUT_MS = 120_000;

const SUGGESTIONS = [
  "What is a SIP, and how is it different from a lump sum?",
  "How much of my income should go into an emergency fund?",
  "What does KYC actually require me to provide?",
  "How is a mutual fund's expense ratio charged?",
  "What protection do I have if a UPI payment goes to the wrong person?",
];

type Turn = {
  id: number;
  question: string;
  answer: string;
  mode: "grounded" | "general" | null;
  sources: SourceEntry[];
  done: boolean;
  error: string | null;
};

export function Coach() {
  const params = useSearchParams();
  const opening = params.get("q") ?? "";

  const [question, setQuestion] = React.useState(opening);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [panelFor, setPanelFor] = React.useState<number | null>(null);
  const [activeCitation, setActiveCitation] = React.useState<number | undefined>();
  const nextId = React.useRef(1);
  const live = React.useRef<HTMLDivElement>(null);

  const ask = React.useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const id = nextId.current++;
    setBusy(true);
    setQuestion("");
    setTurns((t) => [
      ...t,
      { id, question: trimmed, answer: "", mode: null, sources: [], done: false, error: null },
    ]);

    const url = `${API}/api/chat`;
    try {
      const res = await apiFetch(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        },
        CHAT_TIMEOUT_MS,
      );

      const reader = res.body?.getReader();
      if (!reader) throw new Error("The response carried no body.");
      const decoder = new TextDecoder();
      let buffer = "";

      // The delimiter can land across two chunks, so the split is done on
      // the accumulated buffer every time rather than per chunk.
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const cut = buffer.indexOf(DELIM);
        const body = cut === -1 ? buffer : buffer.slice(0, cut);
        setTurns((t) =>
          t.map((turn) => (turn.id === id ? { ...turn, answer: body } : turn)),
        );
      }

      const cut = buffer.indexOf(DELIM);
      const body = cut === -1 ? buffer : buffer.slice(0, cut);
      const tail = cut === -1 ? "" : buffer.slice(cut + DELIM.length);
      const meta = parseMeta(tail);

      setTurns((t) =>
        t.map((turn) =>
          turn.id === id
            ? { ...turn, answer: body, done: true, ...meta }
            : turn,
        ),
      );
    } catch (err) {
      const message = await describeApiFailure(err, url);
      setTurns((t) =>
        t.map((turn) =>
          turn.id === id ? { ...turn, done: true, error: message } : turn,
        ),
      );
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // A question handed over from the header search runs itself, once.
  const fired = React.useRef(false);
  React.useEffect(() => {
    if (opening && !fired.current) {
      fired.current = true;
      void ask(opening);
    }
  }, [opening, ask]);

  const panelTurn = turns.find((t) => t.id === panelFor) ?? null;

  return (
    <div className="enter flex flex-col gap-8">
      <PageHeader
        title="Your financial coach"
        purpose="Ask anything about money. Answers are grounded in verified financial sources, and each one shows the passage it came from."
      />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="flex flex-col gap-8">
          {turns.length === 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="type-heading text-ink">Not sure where to start?</h2>
              <ul className="flex flex-col">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion} className="ledger-rule">
                    <button
                      type="button"
                      onClick={() => void ask(suggestion)}
                      className="type-body row-hover w-full py-4 text-left text-ink"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div ref={live} className="flex flex-col gap-12" aria-live="polite">
            {turns.map((turn) => (
              <TurnView
                key={turn.id}
                turn={turn}
                onOpenSources={(n) => {
                  setPanelFor(turn.id);
                  setActiveCitation(n);
                }}
                onRetry={() => void ask(turn.question)}
              />
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(question);
            }}
            className="sticky bottom-16 flex flex-col gap-2 border-t border-line bg-canvas pt-4 md:bottom-0"
          >
            <label htmlFor="ask-input" className="sr-only-text">
              Ask your financial coach a question
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id="ask-input"
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter breaks the line. A question is
                  // usually one sentence, so sending is the common case.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void ask(question);
                  }
                }}
                placeholder="Ask about savings, investing, UPI, KYC, insurance…"
                className="type-body w-full resize-none border border-line-strong bg-canvas px-2 py-2 text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
              />
              <Button
                type="submit"
                variant="primary"
                loading={busy}
                loadingLabel="Reading…"
                disabled={!question.trim()}
                className="h-11"
              >
                <ArrowUp className="lucide size-4" aria-hidden="true" />
                <span className="sr-only-text">Send question</span>
              </Button>
            </div>
            <DisclaimerNote />
          </form>
        </div>

        {/* The sources rail on wide screens; a sheet below lg. */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-4">
            <h2 className="type-eyebrow text-ink-muted">About these answers</h2>
            <p className="type-body text-ink-secondary">
              Each question is matched against a corpus of RBI, SEBI and NCFE
              publications before anything is written. The numbered markers in
              an answer open the passage they came from.
            </p>
            <ButtonLink href="/sources">
              See every source document
            </ButtonLink>
          </div>
        </aside>
      </div>

      <Sheet
        open={panelFor !== null}
        onOpenChange={(open) => {
          if (!open) setPanelFor(null);
        }}
        side="right"
        title="Sources for this answer"
        description="Quoted verbatim from the document that was retrieved."
      >
        {panelTurn ? (
          <SourcePanel
            entries={panelTurn.sources}
            activeN={activeCitation}
            onSelect={setActiveCitation}
          />
        ) : null}
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ turn */

function TurnView({
  turn,
  onOpenSources,
  onRetry,
}: {
  turn: Turn;
  onOpenSources: (n?: number) => void;
  onRetry: () => void;
}) {
  return (
    <article className="flex flex-col gap-4">
      <h2 className="type-heading prose-measure text-ink">{turn.question}</h2>

      {turn.error ? (
        <ErrorState
          title="That answer could not be fetched"
          detail={turn.error}
          onRetry={<Button onClick={onRetry}>Ask again</Button>}
        />
      ) : (
        <>
          {turn.mode === "general" ? (
            <div className="flex flex-col gap-2">
              <Badge tone="critical">Not from a verified source</Badge>
              <UnverifiedNote />
            </div>
          ) : turn.done ? (
            <Badge tone="positive">
              Grounded in {turn.sources.length || "no"}{" "}
              {turn.sources.length === 1 ? "source" : "sources"}
            </Badge>
          ) : null}

          <div className="type-body prose-measure flex flex-col gap-4 text-ink">
            {renderAnswer(turn, onOpenSources)}
            {!turn.done ? (
              <span className="type-label text-ink-muted">
                Reading the sources…
              </span>
            ) : null}
          </div>

          {turn.sources.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="type-label text-ink-muted">Sources:</span>
              {turn.sources.map((s) => (
                <Citation
                  key={s.n}
                  n={s.n}
                  source={prettySource(s.source)}
                  page={s.page}
                  onActivate={onOpenSources}
                />
              ))}
              <Button size="sm" onClick={() => onOpenSources()}>
                View sources
              </Button>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}

/**
 * Split the answer on inline `[n]` markers and render each as a real
 * citation button. Anything that is not a marker is left exactly as the
 * model wrote it — no markdown is interpreted, because the system prompt
 * forbids the model from emitting any and rendering it anyway would invite
 * it back in.
 */
function renderAnswer(turn: Turn, onOpen: (n?: number) => void) {
  const known = new Set(turn.sources.map((s) => s.n));

  return turn.answer.split(/\n{2,}/).map((paragraph, pi) => (
    <p key={pi}>
      {paragraph.split(/(\[\d{1,2}\])/g).map((part, i) => {
        const match = /^\[(\d{1,2})\]$/.exec(part);
        if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;
        const n = Number(match[1]);
        const source = turn.sources.find((s) => s.n === n);
        // A marker with no matching source is left as plain text rather
        // than rendered as a button that opens nothing.
        if (!known.has(n) || !source) {
          return <React.Fragment key={i}>{part}</React.Fragment>;
        }
        return (
          <Citation
            key={i}
            n={n}
            source={prettySource(source.source)}
            page={source.page}
            onActivate={onOpen}
          />
        );
      })}
    </p>
  ));
}

/* ------------------------------------------------------------------ meta */

/**
 * Parse the metadata tail. Accepts the current object shape and the older
 * bare array, and never throws — a malformed tail must degrade to "no
 * sources", not to a blank screen where an answer already streamed in.
 */
function parseMeta(tail: string): {
  mode: Turn["mode"];
  sources: SourceEntry[];
} {
  if (!tail.trim()) return { mode: "grounded", sources: [] };
  try {
    const parsed = JSON.parse(tail);
    if (Array.isArray(parsed)) {
      return { mode: "grounded", sources: parsed as SourceEntry[] };
    }
    return {
      mode: parsed.mode === "general" ? "general" : "grounded",
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch {
    return { mode: "grounded", sources: [] };
  }
}
