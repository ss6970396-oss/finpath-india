import { cn } from "@/lib/utils";

/**
 * WHERE ANSWERS COME FROM — the claim, in exactly one place.
 *
 * It has to be true of what is INDEXED, not of what is on disk. Today the
 * index holds one document, `backend/data/collegestudents.pdf`, developed
 * by MCX and FTKMC under the guidance of SEBI's Investor Protection and
 * Education Fund advisory committee. The RBI, NCFE and SEBI booklets in
 * `backend/data_hold/` are not indexed, so the product must not say it
 * answers from them.
 *
 * The day `ingest.py` runs over data_hold/ (and `probe_threshold.py` is
 * re-run), change CORPUS_PHRASE to "RBI, SEBI and NCFE publications" and
 * every screen follows: the landing, the auth panel, the coach, /sources,
 * the footer and the page metadata all read it from here.
 */
export const CORPUS_PHRASE =
  "financial-education publications made under SEBI's investor-education programme";

/** The one-sentence promise: where answers come from, and what FinPath is not. */
export const TRUST_LINE = `Answers come from ${CORPUS_PHRASE}, and FinPath sells nothing.`;

export function TrustLine({ className }: { className?: string }) {
  return (
    <p className={cn("type-body prose-measure text-ink-secondary", className)}>
      {TRUST_LINE}
    </p>
  );
}
