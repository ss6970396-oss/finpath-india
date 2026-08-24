"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./states";

/**
 * SourcePanel (§32, §34) — where a citation lands.
 *
 * Each entry shows the document, the authority, the page, and THE RETRIEVED
 * CLAUSE VERBATIM. The verbatim text is the whole point: naming a document
 * asks the reader to trust that it says what we claim, and showing the
 * passage lets them check.
 *
 * ON DATES. §34 asks every source to expose a publication date and, where
 * available, a last-amended date. The RAG index stores four columns —
 * source, page, content, embedding — and holds neither. So a missing date
 * renders as "not stated in the document" and is NEVER inferred, never left
 * blank, and never filled with a plausible-looking value. Fabricating a
 * date under a regulator's name is precisely the failure the citation rule
 * exists to prevent. Closing that gap needs a document_meta table populated
 * by hand from each PDF's front matter — see conflict C-02 in docs/audit.md.
 */

export type SourceEntry = {
  n: number;
  /** The document filename or title. */
  source: string;
  page: number;
  /** The retrieved chunk, verbatim. Never paraphrased. */
  snippet: string;
  /** RBI / SEBI / NCFE, where the document itself states it. */
  authority?: string;
  /** ISO date, or omitted when the document does not state one. */
  published?: string;
  amended?: string;
};

export function SourcePanel({
  entries,
  activeN,
  onSelect,
  className,
}: {
  entries: readonly SourceEntry[];
  activeN?: number;
  onSelect?: (n: number) => void;
  className?: string;
}) {
  return (
    <aside
      aria-label="Sources"
      className={cn("flex flex-col gap-4", className)}
    >
      <h2 className="type-label border-b border-line pb-2 text-ink-muted uppercase">
        Sources
      </h2>

      {entries.length === 0 ? (
        <EmptyState
          title="No sources for this answer"
          description="Nothing in the regulatory corpus was close enough to this question, so the answer is not drawn from a cited document."
        />
      ) : (
        <ol className="flex flex-col gap-4">
          {entries.map((entry) => (
            <SourceItem
              key={entry.n}
              entry={entry}
              active={entry.n === activeN}
              onSelect={onSelect}
            />
          ))}
        </ol>
      )}
    </aside>
  );
}

function SourceItem({
  entry,
  active,
  onSelect,
}: {
  entry: SourceEntry;
  active: boolean;
  onSelect?: (n: number) => void;
}) {
  const ref = React.useRef<HTMLLIElement>(null);

  React.useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [active]);

  return (
    <li
      ref={ref}
      id={`source-${entry.n}`}
      // The active entry is marked by a strong border AND by the numeral
      // block, so the state is not carried by a colour change alone.
      className={cn(
        "border bg-canvas",
        active ? "border-line-strong" : "border-line",
      )}
    >
      <div className="flex items-start gap-2 border-b border-line px-4 py-2">
        <span
          className={cn(
            "type-data flex size-6 shrink-0 items-center justify-center border text-sm",
            active
              ? "border-line-strong bg-ink text-canvas"
              : "border-line text-ink-secondary",
          )}
        >
          {entry.n}
        </span>
        <div className="min-w-0 flex-1">
          <p className="type-label text-ink">{entry.source}</p>
          <p className="type-label text-ink-muted">
            {entry.authority ?? "Authority not stated"} · page{" "}
            <span className="type-data">{entry.page}</span>
          </p>
        </div>
      </div>

      <blockquote className="type-body px-4 py-2 text-ink-secondary">
        {entry.snippet}
      </blockquote>

      <dl className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line px-4 py-2">
        <DateField label="Published" value={entry.published} />
        <DateField label="Last amended" value={entry.amended} />
      </dl>

      {onSelect ? (
        <div className="border-t border-line px-4 py-1">
          <button
            type="button"
            onClick={() => onSelect(entry.n)}
            className="type-label text-ink-secondary underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
          >
            Show where this was cited
          </button>
        </div>
      ) : null}
    </li>
  );
}

/**
 * A date field that is honest about not knowing. "not stated in the
 * document" is a real answer; an empty cell is not.
 */
function DateField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <dt className="type-label text-ink-muted">{label}</dt>
      <dd
        className={cn(
          value ? "type-data text-sm text-ink" : "type-label text-ink-muted italic",
        )}
      >
        {value ?? "not stated in the document"}
      </dd>
    </div>
  );
}
