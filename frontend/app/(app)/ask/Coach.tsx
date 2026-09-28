"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUp, CircleAlert, Square } from "lucide-react";
import {
  Badge,
  BareTextarea,
  Button,
  Citation,
  DisclaimerNote,
  MarginBody,
  MarginLayout,
  MarginNote,
  Notice,
  SectionLabel,
  Sheet,
  type SourceEntry,
  SourcePanel,
  TRUST_LINE,
  UnverifiedNote,
} from "@/components/ui";
import { apiFetch, describeApiFailure } from "@/lib/api";
import { prettySource } from "@/lib/format";
import { cn } from "@/lib/utils";
import { API } from "../../providers/FinPathProvider";
import { useMediaQuery, WIDE } from "../../components/useMediaQuery";

/**
 * /ask (§9) — the financial coach.
 *
 * A CHAT'S STRUCTURE, A BOOK'S LOOK. One centred reading column, a
 * composer pinned to the bottom, your questions in sunken blocks on the
 * right, and the answers set directly on the paper as reading text — no
 * bubble, no avatar, no typing dots. What makes it this product rather
 * than a generic chat:
 *
 *   1. IT OPENS WITH QUESTIONS the corpus can actually answer, not an
 *      empty box. The four suggestions are topics the indexed booklet
 *      covers (compounding, inflation, saving vs investing, borrowing).
 *   2. EVERY CLAIM CARRIES ITS SOURCE. `[1]` markers become real buttons
 *      that open the passage verbatim. At >= 1280px each answer's sources
 *      sit in the margin beside it; below that, as a compact list under
 *      it. The inspector is a side panel on wide screens and a bottom
 *      sheet on narrow ones.
 *   3. IT SAYS WHAT KIND OF ANSWER IT IS, in words, at the top: grounded
 *      in N sources, or not from a verified source.
 *
 * FAILURES ARE NOTES, NOT PANELS. A rate limit or a failed generation
 * arrives inside the stream as text (backend/main.py), and a network
 * failure arrives as an error; both render as a calm inline note with
 * "Ask again", and neither discards what had already streamed (B-2, B-3).
 * Stop cancels the read and keeps the partial answer, marked incomplete.
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

/**
 * Topics `backend/data/collegestudents.pdf` covers — its own chapters on
 * compounding, inflation, savings vs investments and borrowing — so each
 * one lands on the grounded path rather than the general one.
 */
const SUGGESTIONS = [
  "What is the power of compounding, and why does starting early matter?",
  "How does inflation affect the money I save?",
  "What is the difference between saving and investing?",
  "What should I check before taking a loan or using a credit card?",
];

/** The two failure shapes backend/main.py writes into the stream body. */
const FAILED_PREFIX = "The counsellor could not generate an answer.";
const CUT_SHORT = /\n\n\[The answer was cut short\. ([\s\S]*)\]\s*$/;
/** NO_SOURCE_REPLY in backend/main.py, curly apostrophe tolerated. */
const NO_SOURCE = /^I don['’]t have a verified source for that yet\./;

type Turn = {
  id: number;
  question: string;
  answer: string;
  mode: "grounded" | "general" | null;
  sources: SourceEntry[];
  done: boolean;
  /** Why the answer is missing or incomplete, in the backend's own words. */
  failure: string | null;
  stopped: boolean;
};

export function Coach() {
  const params = useSearchParams();
  const wide = useMediaQuery(WIDE);

  // A question handed over from Home (?q=) is PREFILLED, not sent: the
  // student reads it in the composer and presses Enter themselves.
  const [question, setQuestion] = React.useState(params.get("q") ?? "");
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [panelFor, setPanelFor] = React.useState<number | null>(null);
  const [activeCitation, setActiveCitation] = React.useState<number | undefined>();
  const nextId = React.useRef(1);
  const reader = React.useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const stopRequested = React.useRef(false);
  const composer = React.useRef<HTMLTextAreaElement>(null);

  const update = (id: number, patch: Partial<Turn>) =>
    setTurns((t) => t.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)));

  const ask = React.useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const id = nextId.current++;
      stopRequested.current = false;
      setBusy(true);
      setQuestion("");
      setTurns((t) => [
        ...t,
        {
          id,
          question: trimmed,
          answer: "",
          mode: null,
          sources: [],
          done: false,
          failure: null,
          stopped: false,
        },
      ]);

      const url = `${API}/api/chat`;
      let buffer = "";
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

        const r = res.body?.getReader();
        if (!r) throw new Error("The response carried no body.");
        reader.current = r;
        const decoder = new TextDecoder();

        // The delimiter can land across two chunks, so the split is done on
        // the accumulated buffer every time rather than per chunk.
        for (;;) {
          const { value, done } = await r.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const cut = buffer.indexOf(DELIM);
          update(id, { answer: cut === -1 ? buffer : buffer.slice(0, cut) });
        }

        if (stopRequested.current) {
          const cut = buffer.indexOf(DELIM);
          update(id, {
            answer: cut === -1 ? buffer : buffer.slice(0, cut),
            done: true,
            stopped: true,
          });
          return;
        }

        const cut = buffer.indexOf(DELIM);
        const body = cut === -1 ? buffer : buffer.slice(0, cut);
        const tail = cut === -1 ? "" : buffer.slice(cut + DELIM.length);
        update(id, { done: true, ...parseMeta(tail), ...splitFailure(body) });
      } catch (err) {
        // Keep whatever streamed before the failure (B-3), and say why.
        const cut = buffer.indexOf(DELIM);
        update(id, {
          answer: cut === -1 ? buffer : buffer.slice(0, cut),
          done: true,
          failure: await describeApiFailure(err, url),
        });
      } finally {
        reader.current = null;
        setBusy(false);
      }
    },
    [busy],
  );

  function stop() {
    stopRequested.current = true;
    void reader.current?.cancel();
  }

  const panelTurn = turns.find((t) => t.id === panelFor) ?? null;
  const openSources = (turnId: number) => (n?: number) => {
    setPanelFor(turnId);
    setActiveCitation(n);
  };

  return (
    <div className="enter mx-auto flex w-full max-w-(--container-prose) flex-col gap-12 xl:max-w-(--container-annotated)">
      {turns.length === 0 ? (
        <section className="gutter-offset flex flex-col gap-6">
          <h1 className="type-display text-ink">Ask anything about money</h1>
          <p className="type-reading text-ink-secondary">
            {TRUST_LINE}{" "}
            <Link
              href="/sources"
              className="text-accent underline underline-offset-4 hover:text-ink"
            >
              How answers are sourced
            </Link>
          </p>
          <div className="flex flex-col gap-2">
            <SectionLabel>Try one of these</SectionLabel>
            <ul className="flex flex-col">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion} className="border-b border-line">
                  <button
                    type="button"
                    onClick={() => {
                      setQuestion(suggestion);
                      // Straight into the box, so Enter sends it.
                      composer.current?.focus();
                    }}
                    className="type-reading row-hover min-h-11 w-full py-4 text-left text-ink"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
            <p className="type-label text-ink-muted">
              Choosing one puts it in the box below, ready to send.
            </p>
          </div>
        </section>
      ) : (
        <h1 className="sr-only-text">Ask anything about money</h1>
      )}

      <div className="flex flex-col gap-12" aria-live="polite">
        {turns.map((turn) => (
          <TurnView
            key={turn.id}
            turn={turn}
            onOpenSources={openSources(turn.id)}
            onRetry={() => void ask(turn.question)}
          />
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
        className="above-nav gutter-offset sticky z-10 flex flex-col gap-2 border-t border-line bg-canvas pt-4 pb-4"
      >
        <label htmlFor="ask-input" className="sr-only-text">
          Ask your financial coach a question
        </label>
        <div className="flex items-end gap-2">
          <BareTextarea
            id="ask-input"
            ref={composer}
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
            placeholder="Ask about saving, investing, inflation, loans…"
          />
          {busy ? (
            <Button type="button" onClick={stop} className="h-11 shrink-0">
              <Square className="lucide size-4" aria-hidden="true" />
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              disabled={!question.trim()}
              className="h-11 shrink-0"
            >
              <ArrowUp className="lucide size-4" aria-hidden="true" />
              <span className="sr-only-text">Send question</span>
            </Button>
          )}
        </div>
        {/* The page's one disclaimer. It lives INSIDE the sticky form so it
            stays beside the composer while the thread scrolls; moved out of
            the form, it scrolls away with the first answer. */}
        <DisclaimerNote />
      </form>

      <Sheet
        open={panelFor !== null}
        onOpenChange={(open) => {
          if (!open) setPanelFor(null);
        }}
        // A side panel beside the conversation on wide screens; a bottom
        // sheet within thumb reach on a phone.
        side={wide ? "right" : "bottom"}
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
  const refused = turn.done && NO_SOURCE.test(turn.answer.trim());
  const grounded =
    turn.done && turn.mode === "grounded" && turn.sources.length > 0;

  return (
    <article className="flex flex-col gap-6" aria-label={`Question: ${turn.question}`}>
      {/* Your turn: a sunken block on the right. */}
      <div className="gutter-offset flex justify-end">
        <p className="type-reading max-w-full bg-surface-sunken px-4 py-2 text-ink sm:max-w-md">
          <span className="sr-only-text">You asked: </span>
          {turn.question}
        </p>
      </div>

      {/* The answer: on the paper, sources in the margin when there is one. */}
      <MarginLayout>
        <MarginNote className="hidden xl:block">
          {turn.sources.length > 0 ? (
            <SourceList turn={turn} onOpen={onOpenSources} />
          ) : null}
        </MarginNote>

        <MarginBody className={cn(turn.sources.length === 0 && "xl:col-start-2")}>
          <div className="flex flex-col gap-4">
            {/* What kind of answer this is, in words, at the top. */}
            {turn.mode === "general" ? (
              <div className="flex flex-col gap-1">
                <Badge tone="neutral" className="w-fit">
                  <CircleAlert className="lucide size-3.5 shrink-0" aria-hidden="true" />
                  Not from a verified source
                </Badge>
                <UnverifiedNote />
              </div>
            ) : grounded ? (
              <Badge tone="positive" className="w-fit">
                Grounded in {turn.sources.length}{" "}
                {turn.sources.length === 1 ? "source" : "sources"}
              </Badge>
            ) : refused ? (
              <Badge tone="neutral" className="w-fit">
                No verified source for this yet
              </Badge>
            ) : null}

            {turn.answer ? (
              <div className="type-reading flex flex-col gap-4 text-ink">
                {renderAnswer(turn, onOpenSources)}
              </div>
            ) : null}

            {!turn.done ? (
              <span className="type-label text-ink-muted">Reading the sources…</span>
            ) : null}

            {turn.stopped ? (
              <Notice title="Stopped">
                The answer above is incomplete because you stopped it.
              </Notice>
            ) : null}

            {turn.failure ? (
              <Notice
                title={turn.answer ? "The answer was cut short" : "No answer this time"}
                action={<Button onClick={onRetry}>Ask again</Button>}
              >
                {turn.failure}
              </Notice>
            ) : null}

            {/* Below 1280px the sources sit under the answer instead. */}
            {turn.sources.length > 0 ? (
              <div className="xl:hidden">
                <SourceList turn={turn} onOpen={onOpenSources} />
              </div>
            ) : null}
          </div>
        </MarginBody>
      </MarginLayout>
    </article>
  );
}

/** The sources of one answer: a compact list, or the margin's notes. */
function SourceList({
  turn,
  onOpen,
}: {
  turn: Turn;
  onOpen: (n?: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SectionLabel as="p">Sources</SectionLabel>
      <ol className="flex flex-col gap-1">
        {turn.sources.map((s) => (
          <li key={s.n} className="flex items-baseline gap-2 xl:justify-end">
            <Citation
              n={s.n}
              source={prettySource(s.source)}
              page={s.page}
              onActivate={onOpen}
            />
            <span className="type-label text-ink-muted">
              {prettySource(s.source)}, p.{" "}
              <span className="type-data">{s.page}</span>
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onOpen()}
        className="type-label min-h-11 w-fit text-accent underline underline-offset-4 hover:text-ink xl:self-end"
      >
        Read the passages
      </button>
    </div>
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
      {/* "[1]", and the combined "[1, 2]" the model sometimes writes. */}
      {paragraph.split(/(\[\d{1,2}(?:,\s*\d{1,2})*\])/g).map((part, i) => {
        const match = /^\[(\d{1,2}(?:,\s*\d{1,2})*)\]$/.exec(part);
        if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;
        const ns = match[1].split(/,\s*/).map(Number);
        // A marker with no matching source is left as plain text rather
        // than rendered as a button that opens nothing.
        if (!ns.every((n) => known.has(n))) {
          return <React.Fragment key={i}>{part}</React.Fragment>;
        }
        return (
          <React.Fragment key={i}>
            {ns.map((n) => {
              const source = turn.sources.find((s) => s.n === n)!;
              return (
                <Citation
                  key={n}
                  n={n}
                  source={prettySource(source.source)}
                  page={source.page}
                  onActivate={onOpen}
                />
              );
            })}
          </React.Fragment>
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

/**
 * B-2: a generation failure (a 429 rate limit included) is not an HTTP
 * error — backend/main.py writes the reason into the stream as text. Pull
 * it out of the answer so it renders as a note, not as an answer with a
 * "grounded" badge.
 */
function splitFailure(body: string): { answer: string; failure: string | null } {
  const trimmed = body.trim();
  if (trimmed.startsWith(FAILED_PREFIX)) {
    return { answer: "", failure: trimmed.slice(FAILED_PREFIX.length).trim() };
  }
  const cut = CUT_SHORT.exec(body);
  if (cut) {
    return { answer: body.slice(0, cut.index), failure: cut[1].trim() };
  }
  return { answer: body, failure: null };
}

