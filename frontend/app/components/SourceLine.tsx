"use client";

import Link from "next/link";
import { Provenance } from "@/components/ui";
import { SOURCE_LABEL, useFinPath } from "../providers/FinPathProvider";

/**
 * "Based on: …" — rendered by every page that shows a figure (§28).
 *
 * The wording comes from SOURCE_LABEL so it is identical on every screen,
 * and the way out is always offered: an example month links to the place
 * that replaces it, declared figures link to the statement upload.
 */
export function SourceLine({ className }: { className?: string }) {
  const { source, setUseExample } = useFinPath();

  return (
    <Provenance
      source={SOURCE_LABEL[source]}
      illustrative={source === "example"}
      className={className}
      action={
        source === "example" ? (
          <button
            type="button"
            onClick={() => setUseExample(false)}
            className="underline underline-offset-4 hover:text-ink"
          >
            Use my own figures instead
          </button>
        ) : source === "declared" ? (
          <Link
            href="/spending"
            className="underline underline-offset-4 hover:text-ink"
          >
            Upload a statement for actuals
          </Link>
        ) : null
      }
    />
  );
}
