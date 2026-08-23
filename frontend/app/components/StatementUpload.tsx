"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet, X, TriangleAlert, Download, FlaskConical } from "lucide-react";
import { parseStatement, SAMPLE_CSV, type ParseResult } from "@/lib/csv";
import { useFinPath } from "../providers/FinPathProvider";
import { Card, CardHead, Label, Pill, Button } from "./ui";
import { inr } from "@/lib/format";

export default function StatementUpload() {
  const { uploaded, setUploaded, profile } = useFinPath();
  const [result, setResult] = useState<ParseResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ingest = useCallback(
    async (file: File) => {
      setBusy(true);
      try {
        const text = await file.text();
        const parsed = parseStatement(text);
        setResult(parsed);
        setUploaded(parsed.transactions.length ? parsed.transactions : null);
      } catch {
        setResult({
          transactions: [],
          skipped: 0,
          errors: ["Could not read that file. Plain-text CSV only."],
          columns: { date: "", merchant: "", amount: "" },
        });
      } finally {
        setBusy(false);
      }
    },
    [setUploaded],
  );

  function clear() {
    setResult(null);
    setUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function downloadTemplate() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finpath-statement-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const active = uploaded !== null;

  return (
    <Card>
      <CardHead
        title="Statement parser"
        sub="Parsed in your browser. The file is never uploaded to the API."
        right={
          <Pill tone={active ? "sage" : "neutral"}>
            <FlaskConical className="h-3 w-3" />
            {active ? "Uploaded ledger active" : "Sandbox preset active"}
          </Pill>
        }
      />

      <div className="px-5 py-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) ingest(f);
          }}
          className={`rounded-md border border-dashed px-5 py-8 text-center transition ${
            dragging ? "border-forest bg-sage" : "border-line-strong bg-surface-2"
          }`}
        >
          <Upload className="mx-auto h-5 w-5 text-meta" />
          <p className="mt-3 text-[13px] font-medium text-ink">
            Drop a CSV statement here
          </p>
          <p className="mt-1 text-[12px] text-meta">
            Needs a date, a description and an amount column. Bank column names
            are matched automatically.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {busy ? "Reading…" : "Choose file"}
            </Button>
            <Button variant="ghost" onClick={downloadTemplate}>
              <Download className="h-3.5 w-3.5" />
              Template
            </Button>
            {active && (
              <Button variant="ghost" onClick={clear}>
                <X className="h-3.5 w-3.5" />
                Back to sandbox
              </Button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) ingest(f);
            }}
          />
        </div>

        {result && (
          <div className="fade-up mt-4 space-y-3">
            {result.transactions.length > 0 && (
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
                {[
                  ["Rows parsed", String(result.transactions.length)],
                  ["Rows skipped", String(result.skipped)],
                  [
                    "Total value",
                    inr(result.transactions.reduce((s, t) => s + t.amount, 0)),
                  ],
                  ["Against allowance", inr(profile.allowance)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-surface px-3 py-2.5">
                    <Label>{k}</Label>
                    <p className="figure mt-0.5 text-sm font-medium text-ink">
                      {v}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {result.transactions.length > 0 && (
              <p className="text-[12px] leading-relaxed text-meta">
                Mapped columns —{" "}
                <span className="text-ink">{result.columns.date}</span>,{" "}
                <span className="text-ink">{result.columns.merchant}</span>,{" "}
                <span className="text-ink">{result.columns.amount}</span>.
                Categories are assigned heuristically from the description; the
                residual falls to Wants, which is the bucket the nudge engine
                polices.
              </p>
            )}

            {result.errors.length > 0 && (
              <div className="rounded-md border border-ochre/30 bg-ochre-tint px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-ochre-ink">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  {result.transactions.length
                    ? "Some rows were skipped"
                    : "Could not parse this file"}
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {result.errors.map((e) => (
                    <li key={e} className="text-[12px] leading-relaxed text-ochre-ink">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!result && (
          <p className="mt-3.5 text-[12px] leading-relaxed text-meta">
            Without an upload the engine runs on the simulated UPI feed from the
            API, regenerated on each load. Both paths flow through the same
            diagnosis, so the Simulator and Roadmap stay in sync either way.
          </p>
        )}
      </div>
    </Card>
  );
}
