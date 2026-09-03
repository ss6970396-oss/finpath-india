"use client";

import * as React from "react";
import { Button, ButtonLink } from "@/components/ui";

/**
 * The route error boundary (§21).
 *
 * NO STACK TRACE. A student who hits an exception is shown what broke in
 * one sentence and given a way forward; the trace goes to the console,
 * where the person who can act on it is looking. `digest` is included
 * because it is the one token that lets a report be matched to a server log
 * — it is an identifier, not an explanation, and it is labelled as such.
 *
 * `reset()` re-renders the segment. It is offered first because a
 * surprising number of these are a transient fetch failure, and retrying in
 * place beats losing the page.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[finpath] route error", error);
  }, [error]);

  return (
    <main
      id="main"
      className="page-shell flex min-h-dvh w-full flex-col items-start justify-center gap-8 py-16"
    >
      <div className="flex max-w-2xl flex-col gap-4">
        <p className="type-eyebrow text-critical">Something broke</p>
        <h1 className="type-display text-ink">
          This page stopped part-way through.
        </h1>
        <p className="type-body prose-measure text-ink-secondary">
          Nothing you entered has been lost — your figures are stored
          separately from the page that was drawing them. Trying again is
          usually enough; if it is not, the sections below still work on
          their own.
        </p>
        {error.digest ? (
          <p className="type-label text-ink-muted">
            Reference for a bug report:{" "}
            <span className="type-data text-ink">{error.digest}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-4">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/home">Go to Home</ButtonLink>
      </div>
    </main>
  );
}
