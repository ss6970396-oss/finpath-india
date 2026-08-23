"use client";

import { useState } from "react";
import { BookMarked, ExternalLink, FileText, Info, ScrollText } from "lucide-react";
import { metaFor, UNRECORDED_FIELDS } from "@/lib/corpus";
import { API } from "../providers/FinPathProvider";
import { Figure, Label, Pill, Empty } from "./ui";

export type Src = {
  n: number;
  source: string;
  page: number;
  /** Retrieved chunk, verbatim. Optional so an older backend still parses. */
  snippet?: string;
};

export default function CitationInspector({
  sources,
  activeN,
  onSelect,
}: {
  sources: Src[];
  activeN: number | null;
  onSelect: (n: number) => void;
}) {
  const [preview, setPreview] = useState(false);
  const active = sources.find((s) => s.n === activeN) ?? sources[0] ?? null;

  if (!active) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-line px-5 py-3.5">
          <Label>Citation inspector</Label>
        </div>
        <Empty
          icon={<BookMarked className="h-4 w-4" />}
          title="No active citation"
          body="Ask a question. Every passage the retriever returns will appear here with its source document, page and verbatim text."
        />
      </div>
    );
  }

  const meta = metaFor(active.source);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-3.5">
        <Label>Citation inspector</Label>
        <button
          onClick={() => setPreview((v) => !v)}
          aria-pressed={preview}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition ${
            preview
              ? "border-sage-line bg-sage text-sage-ink"
              : "border-line bg-surface text-meta hover:text-ink"
          }`}
        >
          <FileText className="h-3 w-3" />
          {preview ? "Hide page" : "View page"}
        </button>
      </div>

      {/* source switcher */}
      {sources.length > 1 && (
        <div className="flex flex-wrap gap-1.5 border-b border-line px-5 py-2.5">
          {sources.map((s) => (
            <button
              key={s.n}
              onClick={() => onSelect(s.n)}
              aria-pressed={s.n === active.n}
              className={`figure rounded border px-2 py-0.5 text-[11px] transition ${
                s.n === active.n
                  ? "border-forest bg-forest text-on-forest"
                  : "border-line bg-surface text-meta hover:text-ink"
              }`}
            >
              [{s.n}]
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="sage">{meta.issuer}</Pill>
            <Pill>{meta.category}</Pill>
            <Pill>
              <Figure>
                Page {active.page}
              </Figure>
            </Pill>
          </div>

          <h3 className="mt-3 font-display text-lg leading-snug tracking-tight text-ink">
            {meta.title}
          </h3>
          <p className="figure mt-1 break-all text-[11px] text-meta">
            {active.source}
          </p>

          {meta.note && (
            <p className="mt-2.5 text-[12px] leading-relaxed text-meta">
              {meta.note}
            </p>
          )}

          <p className="mt-2 text-[11px] text-meta">
            Issuer {meta.attribution}.
          </p>
        </div>

        {/* verbatim excerpt */}
        <div className="border-t border-line px-5 py-4">
          <Label>Retrieved passage</Label>
          {active.snippet ? (
            <blockquote className="mt-2 whitespace-pre-wrap rounded-md border border-line bg-surface-2 p-3.5 text-[13px] leading-relaxed text-ink-2">
              {active.snippet}
            </blockquote>
          ) : (
            <p className="mt-2 rounded-md border border-line bg-surface-2 p-3.5 text-[13px] text-meta">
              Passage text was not included with this response. Ask again to
              retrieve it.
            </p>
          )}
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-meta">
            <ScrollText className="mt-0.5 h-3 w-3 shrink-0" />
            This is the exact chunk the retriever matched. The counselor is
            instructed to answer from this text and nothing else.
          </p>
        </div>

        {/* page preview */}
        {preview && (
          <div className="border-t border-line px-5 py-4">
            <Label>Document page</Label>
            <div className="mt-2 overflow-hidden rounded-md border border-line bg-surface-2">
              <iframe
                key={`${active.source}-${active.page}`}
                src={`${API}/api/source/${encodeURIComponent(active.source)}#page=${active.page}`}
                title={`${meta.title}, page ${active.page}`}
                className="h-[420px] w-full"
              />
            </div>
            <a
              href={`${API}/api/source/${encodeURIComponent(active.source)}#page=${active.page}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-ink underline-offset-4 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Open the full document
            </a>
            <p className="mt-1.5 text-[11px] leading-relaxed text-meta">
              Served from the local corpus. If the frame is blank, the document
              is indexed but its file is no longer in the ingest directory.
            </p>
          </div>
        )}

        {/* what the index does not hold */}
        <div className="border-t border-line px-5 py-4">
          <Label>Not recorded in the index</Label>
          <ul className="mt-2 space-y-1">
            {UNRECORDED_FIELDS.map((f) => (
              <li
                key={f}
                className="flex items-center justify-between gap-3 text-[12px]"
              >
                <span className="text-meta">{f}</span>
                <span className="shrink-0 text-[11px] text-meta">—</span>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-meta">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            The index stores source, page and text only. These fields are shown
            as unrecorded rather than filled in, because inferring a circular
            number would be a fabricated citation.
          </p>
        </div>
      </div>
    </div>
  );
}
