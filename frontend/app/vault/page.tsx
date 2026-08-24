"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookMarked, Database, Download, ExternalLink, Search, TriangleAlert,
  CircleCheck, CircleSlash, Info,
} from "lucide-react";
import { API } from "../providers/FinPathProvider";
import { Card, CardHead, Figure, Label, Pill, Empty, Button } from "../components/ui";
import { metaFor, type Category, type Issuer } from "@/lib/corpus";

type DocRow = {
  file: string;
  bytes: number | null;
  chunks: number;
  indexed: boolean;
};

type SourcesPayload = {
  documents: DocRow[];
  total_chunks: number;
  index_ready: boolean;
};

const ISSUERS: (Issuer | "All")[] = ["All", "RBI", "SEBI", "NCFE", "Unattributed"];
const CATEGORIES: (Category | "All")[] = [
  "All",
  "Capital Markets",
  "Banking",
  "Consumer Rights",
  "Financial Education",
];

const mb = (b: number | null) =>
  b === null ? "—" : (b / (1024 * 1024)).toFixed(1) + " MB";

export default function Vault() {
  const [payload, setPayload] = useState<SourcesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [issuer, setIssuer] = useState<Issuer | "All">("All");
  const [category, setCategory] = useState<Category | "All">("All");

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/sources`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: SourcesPayload) => {
        if (!cancelled) {
          setPayload(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not reach the API on port 8000.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const docs = payload?.documents ?? [];
    const q = query.trim().toLowerCase();
    return docs
      .map((d) => ({ ...d, meta: metaFor(d.file) }))
      .filter((d) => {
        if (issuer !== "All" && d.meta.issuer !== issuer) return false;
        if (category !== "All" && d.meta.category !== category) return false;
        if (
          q &&
          !d.meta.title.toLowerCase().includes(q) &&
          !d.file.toLowerCase().includes(q) &&
          !d.meta.issuer.toLowerCase().includes(q)
        )
          return false;
        return true;
      });
  }, [payload, query, issuer, category]);

  const indexedCount = rows.filter((r) => r.indexed).length;

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-8">
      <header>
        <Label>Archive · Regulatory Vault</Label>
        <h1 className="mt-1.5 font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight tracking-tight text-ink">
          Sources
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          Exactly what the counselor can cite. This list is read from the corpus
          directory and joined against the live index — it is not a curated
          catalogue, so a document missing here cannot be cited anywhere in the
          product.
        </p>
      </header>

      {/* index status */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Documents in corpus",
            value: String(payload?.documents.length ?? 0),
            icon: BookMarked,
          },
          {
            label: "Chunks indexed",
            value: String(payload?.total_chunks ?? 0),
            icon: Database,
          },
          {
            label: "Retrieval status",
            value: payload?.index_ready ? "Ready" : "Empty",
            icon: payload?.index_ready ? CircleCheck : CircleSlash,
          },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-2">
              <s.icon
                className={`h-4 w-4 ${
                  s.label === "Retrieval status" && !payload?.index_ready
                    ? "text-warn"
                    : "text-accent"
                }`}
              />
              <Label>{s.label}</Label>
            </div>
            <Figure
              className={`mt-2.5 block text-3xl font-semibold tracking-tight ${
                s.label === "Retrieval status" && !payload?.index_ready
                  ? "text-warn"
                  : "text-ink"
              }`}
            >
              {loading ? "—" : s.value}
            </Figure>
          </Card>
        ))}
      </div>

      {payload && !payload.index_ready && (
        <div className="mt-4 rounded-md border border-warn/30 bg-warn-weak px-4 py-3.5">
          <p className="flex items-center gap-2 text-[13px] font-medium text-warn">
            <TriangleAlert className="h-4 w-4" />
            The retrieval index is empty
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-warn">
            The documents below are present on disk but no chunks have been
            embedded, so the counselor will decline every question. Run{" "}
            <span className="figure">uv run python ingest.py</span> from the{" "}
            <span className="figure">backend/</span> directory to populate it.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-danger/30 bg-danger-weak px-4 py-3.5">
          <p className="flex items-center gap-2 text-[13px] font-medium text-danger">
            <TriangleAlert className="h-4 w-4" />
            {error}
          </p>
          <p className="mt-1 text-[12px] text-danger">
            The vault reads its catalogue from the API, so nothing can be listed
            while the backend is down.
          </p>
        </div>
      )}

      {/* filters */}
      <Card className="mt-6">
        <CardHead
          title="Source index"
          sub={`${rows.length} document${rows.length === 1 ? "" : "s"} shown · ${indexedCount} searchable`}
          right={
            <div className="flex items-center gap-2 rounded-md border border-rule bg-surface px-2.5 focus-within:border-accent">
              <Search className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles and filenames"
                aria-label="Search the regulatory index"
                className="w-52 bg-transparent py-1.5 text-[12px] text-ink outline-none placeholder:text-ink-muted"
              />
            </div>
          }
        />

        <div className="flex flex-wrap gap-4 border-b border-rule px-5 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Label className="mr-1">Issuer</Label>
            {ISSUERS.map((i) => (
              <button
                key={i}
                onClick={() => setIssuer(i)}
                aria-pressed={issuer === i}
                className={`rounded-md border px-2.5 py-1 text-[12px] transition ${
                  issuer === i
                    ? "border-rule bg-accent-weak text-accent"
                    : "border-rule bg-surface text-ink-muted hover:text-ink"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Label className="mr-1">Category</Label>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`rounded-md border px-2.5 py-1 text-[12px] transition ${
                  category === c
                    ? "border-rule bg-accent-weak text-accent"
                    : "border-rule bg-surface text-ink-muted hover:text-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-center text-[13px] text-ink-muted">
            Reading the corpus…
          </p>
        ) : rows.length === 0 ? (
          <Empty
            icon={<BookMarked className="h-4 w-4" />}
            title={payload ? "No documents match" : "Catalogue unavailable"}
            body={
              payload
                ? "Clear the issuer, category or search filter to see the full corpus."
                : "Start the backend to read the corpus directory and index status."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left">
              <thead>
                <tr className="border-b border-rule bg-accent-weak">
                  {["Document", "Issuer", "Category", "Chunks", "Size", "Status", ""].map(
                    (h, i) => (
                      <th
                        key={h || i}
                        className={`px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-accent ${
                          i === 3 || i === 4 ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr
                    key={d.file}
                    className="border-b border-rule last:border-0 hover:bg-surface"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-medium text-ink">
                        {d.meta.title}
                      </p>
                      <p className="figure mt-0.5 break-all text-[11px] text-ink-muted">
                        {d.file}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Pill tone={d.meta.issuer === "Unattributed" ? "neutral" : "positive"}>
                        {d.meta.issuer}
                      </Pill>
                      <p className="mt-1 text-[10px] text-ink-muted">
                        {d.meta.attribution}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Pill>{d.meta.category}</Pill>
                    </td>
                    <td className="figure px-5 py-3.5 text-right text-[13px] text-ink">
                      {d.chunks || "—"}
                    </td>
                    <td className="figure px-5 py-3.5 text-right text-[13px] text-ink-muted">
                      {mb(d.bytes)}
                    </td>
                    <td className="px-5 py-3.5">
                      {d.indexed ? (
                        <Pill tone="positive">
                          <CircleCheck className="h-3 w-3" />
                          Searchable
                        </Pill>
                      ) : d.bytes === null ? (
                        <Pill tone="caution">
                          <TriangleAlert className="h-3 w-3" />
                          File missing
                        </Pill>
                      ) : (
                        <Pill tone="caution">
                          <CircleSlash className="h-3 w-3" />
                          Not indexed
                        </Pill>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {d.bytes !== null && (
                        <a
                          href={`${API}/api/source/${encodeURIComponent(d.file)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md border border-rule px-2.5 py-1 text-[12px] text-ink transition hover:border-rule"
                        >
                          <Download className="h-3 w-3" />
                          Open
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-rule px-5 py-3.5">
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-muted">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Issuer attribution is marked as stated in the document or inferred
            from the filename, and is never asserted beyond that. Circular
            numbers, gazette dates and clause identifiers are not held by the
            index and are therefore not displayed — see the citation inspector
            in the{" "}
            <Link href="/counselor" className="underline underline-offset-2">
              counselor
            </Link>
            .
          </p>
        </div>
      </Card>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-rule bg-surface px-5 py-4">
        <div>
          <p className="text-[13px] font-medium text-ink">
            Query this corpus directly
          </p>
          <p className="mt-0.5 text-[12px] text-ink-muted">
            Every counselor answer is restricted to the documents listed above.
          </p>
        </div>
        <Link href="/counselor">
          <Button>
            Open the counselor <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </main>
  );
}
