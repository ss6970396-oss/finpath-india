"use client";

import * as React from "react";
import {
  Button,
  ButtonRow,
  DropZone,
  EmptyState,
  Money,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableScroll,
  useToast,
} from "@/components/ui";
import {
  SAMPLE_CSV,
  detectAllowance,
  fileError,
  parseStatement,
  type AllowanceSuggestion,
  type ParseResult,
  type ParsedTxn,
  type SpendCategory,
} from "@/lib/csv";
import { formatDate, formatPercent } from "@/lib/format";
import { rupeesToPaise } from "@/lib/money";
import { useFinPath } from "../../providers/FinPathProvider";

/**
 * Statement import (§7).
 *
 * IT MUST NOT LOOK LIKE A DEVELOPER TOOL. The parser is genuinely clever —
 * it resolves three different amount conventions, refuses to read a
 * magnitudes-only export as income, and keeps a per-row skip log — and none
 * of that is a reason to show a student a column-binding report. What it
 * shows instead is: how many rows were read, what could not be read and
 * why, and the rows that need a decision from a human.
 *
 * THE FILE NEVER LEAVES THE BROWSER. `parseStatement` is a pure function
 * over the text, and there is no request anywhere in this component. That
 * is stated on the control itself, not in a footnote, because it is the
 * reason anybody would upload a bank statement at all.
 *
 * UNCATEGORISED IS A REAL BUCKET, NOT AN ERROR. It is excluded from the
 * three ratios, so the 30% rule is never policing the parser's ignorance —
 * and the rows sit here, in a list, where a person can place them.
 */

const CATEGORIES: { value: SpendCategory; label: string }[] = [
  { value: "Needs", label: "Essential" },
  { value: "Wants", label: "Discretionary" },
  { value: "Savings", label: "Savings" },
  { value: "Uncategorised", label: "Not yet placed" },
];

export function StatementImport() {
  const { uploaded, setUploaded, assignCategory, uncategorised, profile, saveProfile } =
    useFinPath();
  const toast = useToast();

  const [result, setResult] = React.useState<ParseResult | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState<AllowanceSuggestion | null>(
    null,
  );

  async function read(file: File) {
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseStatement(text);
      setResult(parsed);
      if (parsed.transactions.length) {
        setUploaded(parsed.transactions);
        setSuggestion(detectAllowance(parsed.transactions));
        toast.add({
          title: `${parsed.transactions.length} rows read from ${file.name}`,
          description:
            parsed.skipped > 0
              ? `${parsed.skipped} rows could not be read and are listed below.`
              : "Every row was readable.",
        });
      }
    } catch {
      setResult(fileError("That file could not be read as text."));
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setUploaded(null);
    setResult(null);
    setSuggestion(null);
  }

  return (
    <div className="flex flex-col gap-8">
      <DropZone
        label="Drop your statement here, or choose a file"
        hint="A CSV export from your bank. Most formats work: a single signed column, a debit and credit pair, or an amount with a Dr/Cr column."
        privacyNote="Your file stays in your browser. It is parsed on this device and never uploaded."
        onFile={read}
        disabled={busy}
        footer={
          <ButtonRow align="start">
            <Button onClick={() => setResult(parseStatement(SAMPLE_CSV))}>
              Try it with a sample file
            </Button>
            {uploaded ? (
              <Button onClick={clear}>Remove this statement</Button>
            ) : null}
          </ButtonRow>
        }
      />

      {result?.errors.length ? (
        <div role="alert" className="border border-critical bg-critical-wash px-4 py-4">
          <h3 className="type-subhead text-critical">
            That file could not be used
          </h3>
          <ul className="mt-2 flex flex-col gap-1">
            {result.errors.map((error) => (
              <li key={error} className="type-body text-ink">
                {error}
              </li>
            ))}
          </ul>
          <p className="type-label mt-2 text-ink-muted">
            The file needs a date column, a description column, and at least
            one column carrying the amount.
          </p>
        </div>
      ) : null}

      {result && result.transactions.length > 0 ? (
        <ImportSummary result={result} />
      ) : null}

      {result?.magnitudesOnly ? (
        <p className="type-body prose-measure border-l-2 border-line-strong pl-4 text-ink-secondary">
          Every amount in that file was positive, so it has been read as a
          list of money going out. If it was meant to include credits, they
          would need a minus sign or their own column — otherwise an
          allowance arriving would be counted as spending.
        </p>
      ) : null}

      {suggestion ? (
        <AllowancePrompt
          suggestion={suggestion}
          current={profile.monthlyIncome}
          onAccept={() => {
            saveProfile({ ...profile, monthlyIncome: suggestion.amount });
            setSuggestion(null);
            toast.add({ title: "Monthly income updated" });
          }}
          onDismiss={() => setSuggestion(null)}
        />
      ) : null}

      {uploaded ? (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 border-b border-line pb-2">
            <h3 className="type-heading text-ink">Rows waiting on you</h3>
            <p className="type-body prose-measure text-ink-secondary">
              These merchants are not in the classification table. They are
              kept out of the three ratios until you place them — the 30%
              guideline should measure your spending, not the parser&rsquo;s
              blind spots.
            </p>
          </div>

          {uncategorised.length === 0 ? (
            <EmptyState
              title="Nothing is waiting"
              description="Every row in your statement was classified. Any row can still be changed from the ledger below."
            />
          ) : (
            <ul className="flex flex-col">
              {uncategorised.map((txn) => (
                <li
                  key={txn.id}
                  className="ledger-rule flex flex-wrap items-center justify-between gap-4 py-2"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="type-label text-ink">{txn.merchant}</span>
                    <span className="type-data text-sm text-ink-muted">
                      {formatDate(txn.date)}
                    </span>
                  </span>
                  <Money amount={rupeesToPaise(txn.amount)} />
                  <Select
                    label={`Category for ${txn.merchant}`}
                    hideLabel
                    items={CATEGORIES}
                    value={txn.category as SpendCategory}
                    onValueChange={(v) => assignCategory(txn.id, v)}
                    className="w-48"
                  />
                </li>
              ))}
            </ul>
          )}

          <Ledger transactions={uploaded} onAssign={assignCategory} />
        </section>
      ) : null}

      {result && result.skippedRows.length > 0 ? (
        <SkipReport result={result} />
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */

function ImportSummary({ result }: { result: ParseResult }) {
  return (
    <dl className="grid gap-8 sm:grid-cols-3">
      {[
        {
          label: "Rows read",
          value: String(result.transactions.length),
          note:
            result.skipped > 0
              ? `${result.skipped} could not be read`
              : "Nothing was skipped",
        },
        {
          label: "Money out",
          value: null,
          amount: result.spend,
          note: "Excludes anything arriving in the account",
        },
        {
          label: "Money in",
          value: null,
          amount: result.income,
          note: "Credits are never counted as spending",
        },
      ].map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <dt className="type-label text-ink-muted">{item.label}</dt>
          <dd className="ledger-rule pb-2">
            {item.value !== null ? (
              <span className="type-data text-2xl text-ink">{item.value}</span>
            ) : (
              <Money amount={rupeesToPaise(item.amount ?? 0)} size="lg" />
            )}
          </dd>
          <dd className="type-label text-ink-muted">{item.note}</dd>
        </div>
      ))}
    </dl>
  );
}

function AllowancePrompt({
  suggestion,
  current,
  onAccept,
  onDismiss,
}: {
  suggestion: AllowanceSuggestion;
  current: number;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  if (suggestion.amount === current) return null;
  return (
    <section className="flex flex-col gap-2 border border-line bg-surface px-4 py-4">
      <h3 className="type-subhead text-ink">
        A recurring credit looks like your monthly income
      </h3>
      <p className="type-body prose-measure text-ink-secondary">
        A credit of <Money amount={rupeesToPaise(suggestion.amount)} /> appears{" "}
        {suggestion.occurrences} times, most recently on{" "}
        {formatDate(suggestion.date)}, and accounts for{" "}
        {formatPercent(suggestion.share, { digits: 0 })} of everything arriving
        in the account. Your ratios are currently measured against a different
        figure.
      </p>
      <ButtonRow align="start">
        <Button variant="primary" onClick={onAccept}>
          Use this as my monthly income
        </Button>
        <Button onClick={onDismiss}>Keep what I entered</Button>
      </ButtonRow>
    </section>
  );
}

function Ledger({
  transactions,
  onAssign,
}: {
  transactions: ParsedTxn[];
  onAssign: (id: number, category: SpendCategory) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const rows = open ? transactions : transactions.slice(0, 8);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="type-subhead text-ink">Every row we read</h3>
      <TableScroll label="Parsed transactions">
        <Table caption="Transactions parsed from your statement">
          <THead>
            <TR>
              <TH scope="col">Date</TH>
              <TH scope="col">Merchant</TH>
              <TH scope="col" numeric>
                Amount
              </TH>
              <TH scope="col">Category</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((txn) => (
              <TR key={txn.id}>
                <TD>
                  <span className="type-data text-sm">
                    {formatDate(txn.date)}
                  </span>
                </TD>
                <TD>{txn.merchant}</TD>
                <TD numeric>
                  <Money
                    amount={rupeesToPaise(txn.amount)}
                    size="sm"
                    tone={txn.direction === "in" ? "positive" : "default"}
                  />
                </TD>
                <TD>
                  {txn.direction === "in" ? (
                    <span className="type-label text-ink-muted">
                      Money in — not spending
                    </span>
                  ) : (
                    <Select
                      label={`Category for ${txn.merchant}`}
                      hideLabel
                      items={CATEGORIES}
                      value={txn.category as SpendCategory}
                      onValueChange={(v) => onAssign(txn.id, v)}
                    />
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableScroll>

      {transactions.length > 8 ? (
        <Button onClick={() => setOpen((o) => !o)}>
          {open
            ? "Show fewer rows"
            : `Show all ${transactions.length} rows`}
        </Button>
      ) : null}
    </div>
  );
}

function SkipReport({ result }: { result: ParseResult }) {
  return (
    <section className="flex flex-col gap-2 border border-line px-4 py-4">
      <h3 className="type-subhead text-ink">
        {result.skipped} rows could not be read
      </h3>
      <p className="type-body prose-measure text-ink-secondary">
        These are listed so nothing disappears silently. A skipped row is not
        counted anywhere on this page.
      </p>
      <ul className="flex flex-col">
        {result.skippedRows.slice(0, 10).map((row) => (
          <li
            key={row.row}
            className="ledger-rule flex flex-wrap items-baseline justify-between gap-4 py-2"
          >
            <span className="type-label text-ink">
              Line {row.row}: {row.narration || "(no description)"}
            </span>
            <span className="type-label text-ink-muted">{row.reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
