"use client";

import { useCallback, useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  X,
  TriangleAlert,
  Download,
  FlaskConical,
} from "lucide-react";
import {
  fileError,
  parseStatement,
  skippedToCsv,
  SAMPLE_CSV,
  type ParseResult,
  type SpendCategory,
} from "@/lib/csv";
import { useFinPath } from "../providers/FinPathProvider";
import { Card, CardHead, Label, Pill, Button } from "./ui";
import { Money } from "@/components/finpath";
import { inr, shortDate } from "@/lib/format";

/** The buckets a student can move a row into. Income is not one of them. */
const ASSIGNABLE: SpendCategory[] = ["Needs", "Wants", "Savings"];

/** How many skipped rows to list before deferring to the CSV download. */
const SKIP_PREVIEW = 6;

function download(name: string, body: string) {
  const blob = new Blob([body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StatementUpload() {
  const {
    uploaded,
    setUploaded,
    assignCategory,
    uncategorised,
    profile,
    setProfile,
  } = useFinPath();

  const [result, setResult] = useState<ParseResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  // The allowance prompt is dismissible, but dismissing it must never be the
  // same thing as accepting it. Both buttons set this; only one writes.
  const [allowanceSettled, setAllowanceSettled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ingest = useCallback(
    async (file: File) => {
      setBusy(true);
      setAllowanceSettled(false);
      try {
        const text = await file.text();
        const parsed = parseStatement(text);
        setResult(parsed);
        setUploaded(parsed.transactions.length ? parsed.transactions : null);
      } catch {
        setResult(fileError("Could not read that file. Plain-text CSV only."));
      } finally {
        setBusy(false);
      }
    },
    [setUploaded],
  );

  function clear() {
    setResult(null);
    setUploaded(null);
    setAllowanceSettled(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const active = uploaded !== null;
  const suggestion = result?.allowanceSuggestion ?? null;
  const showAllowancePrompt =
    !!suggestion && !allowanceSettled && suggestion.amount !== profile.allowance;

  // Bound columns, in the order they were resolved. Credit is listed
  // explicitly — it used to be parsed and then left out of this line, which
  // made a correctly-read credit column look like it had been ignored.
  const mapped: [string, string][] = result
    ? (
        [
          ["Date", result.columns.date],
          ["Description", result.columns.merchant],
          ["Amount", result.columns.amount],
          ["Debit", result.columns.debit],
          ["Credit", result.columns.credit],
          ["Dr/Cr", result.columns.type],
        ] as [string, string | undefined][]
      ).flatMap(([role, name]) => (name ? [[role, name] as [string, string]] : []))
    : [];

  return (
    <Card>
      <CardHead
        title="Statement parser"
        sub="Parsed in your browser. The file is never uploaded to the API."
        right={
          <Pill tone={active ? "positive" : "neutral"}>
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
            dragging ? "border-brand bg-brand-weak" : "border-rule-strong bg-surface-1"
          }`}
        >
          <Upload className="mx-auto h-5 w-5 text-ink-muted" />
          <p className="mt-3 text-[13px] font-medium text-ink">
            Drop a CSV statement here
          </p>
          <p className="mt-1 text-[12px] text-ink-muted">
            Needs a date, a description, and either an amount column or a
            Debit/Credit pair. Bank column names are matched automatically.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {busy ? "Reading…" : "Choose file"}
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                download("finpath-statement-template.csv", SAMPLE_CSV)
              }
            >
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
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md bg-rule-subtle sm:grid-cols-4">
                {[
                  ["Rows parsed", String(result.transactions.length)],
                  ["Rows skipped", String(result.skipped)],
                  ["Money out", inr(result.spend)],
                  ["Money in", inr(result.income)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-surface-1 px-3 py-2.5">
                    <Label>{k}</Label>
                    <p className="figure mt-0.5 text-sm font-medium text-ink">
                      {v}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* -------------------------------------- allowance suggestion */}
            {showAllowancePrompt && suggestion && (
              <div className="rounded-md border border-brand-border bg-brand-weak px-3.5 py-3">
                <p className="text-[13px] leading-relaxed text-ink">
                  Detected <Money value={suggestion.amount} size="sm" /> credited
                  on {shortDate(suggestion.date)}
                  {suggestion.occurrences > 1
                    ? ` and ${suggestion.occurrences - 1} more time${
                        suggestion.occurrences > 2 ? "s" : ""
                      }`
                    : ""}
                  . Use this as your monthly allowance instead of{" "}
                  <Money value={profile.allowance} size="sm" />?
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      setProfile("custom", suggestion.amount);
                      setAllowanceSettled(true);
                    }}
                  >
                    Use {inr(suggestion.amount)}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setAllowanceSettled(true)}
                  >
                    Keep mine
                  </Button>
                </div>
              </div>
            )}

            {/* ------------------------------------- uncategorised backlog */}
            {uncategorised.length > 0 && (
              <div className="rounded-md border border-rule bg-surface px-3.5 py-3">
                <p className="text-[13px] font-medium text-ink">
                  {uncategorised.length === 1
                    ? "1 transaction needs a category"
                    : `${uncategorised.length} transactions need a category`}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                  These merchants are not in the rule table. They are held out
                  of the 30% Wants rule until you place them — an unrecognised
                  merchant is not evidence of overspending.
                </p>
                <ul className="mt-3 divide-y divide-rule-subtle border-y border-rule-subtle">
                  {uncategorised.map((t) => (
                    <li
                      key={t.id}
                      className="row-hover -mx-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-sm px-2 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] text-ink">
                          {t.merchant}
                        </span>
                        <span className="text-[12px] text-ink-muted">
                          {shortDate(t.date)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Money value={t.amount} size="sm" />
                        <span className="flex gap-1">
                          {ASSIGNABLE.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => assignCategory(t.id, c)}
                              className="min-h-9 rounded-sm border border-rule-strong px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors duration-[var(--dur-fast)] hover:border-brand hover:text-brand"
                            >
                              {c}
                            </button>
                          ))}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ------------------------------------------ mapped columns */}
            {result.transactions.length > 0 && (
              <p className="text-[12px] leading-relaxed text-ink-muted">
                Mapped columns —{" "}
                {mapped.map(([role, name], i) => (
                  <span key={role}>
                    {i > 0 && ", "}
                    {role}: <span className="text-ink">{name}</span>
                  </span>
                ))}
                .{" "}
                {result.magnitudesOnly &&
                  "That column carried no negative value, so every row was read as money out. "}
                Categories come from the description; anything the rule table
                does not recognise waits in Uncategorised rather than defaulting
                to Wants.
              </p>
            )}

            {/* -------------------------------------------- skipped rows */}
            {result.skippedRows.length > 0 && (
              <div className="rounded-md border border-info-border bg-info-weak px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-info">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  {result.skippedRows.length} row
                  {result.skippedRows.length === 1 ? "" : "s"} skipped
                </p>
                <ul className="mt-2 space-y-1">
                  {result.skippedRows.slice(0, SKIP_PREVIEW).map((r) => (
                    <li
                      key={r.row}
                      className="text-[12px] leading-relaxed text-info"
                    >
                      <span className="figure">Row {r.row}</span> ·{" "}
                      <span className="text-ink">{r.narration}</span> — {r.reason}
                    </li>
                  ))}
                </ul>
                {result.skippedRows.length > SKIP_PREVIEW && (
                  <p className="mt-1 text-[12px] text-info">
                    and {result.skippedRows.length - SKIP_PREVIEW} more.
                  </p>
                )}
                <div className="mt-2.5">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      download(
                        "finpath-skipped-rows.csv",
                        skippedToCsv(result.skippedRows),
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download skipped rows as CSV
                  </Button>
                </div>
              </div>
            )}

            {/* ------------------------------------------ file-level errors */}
            {result.errors.length > 0 && (
              <div className="rounded-md border border-rule bg-danger-weak px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-danger">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  Could not parse this file
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {result.errors.map((e) => (
                    <li
                      key={e}
                      className="text-[12px] leading-relaxed text-danger"
                    >
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!result && (
          <p className="mt-3.5 text-[12px] leading-relaxed text-ink-muted">
            Without an upload the engine runs on the simulated UPI feed from the
            API, regenerated on each load. Both paths flow through the same
            diagnosis, so the Simulator and Roadmap stay in sync either way.
          </p>
        )}
      </div>
    </Card>
  );
}
