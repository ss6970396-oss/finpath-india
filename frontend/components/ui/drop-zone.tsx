"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DropZone (§7) — the statement upload.
 *
 * THE CRITICAL DETAIL IS NOT THE DRAG AND DROP. It is that this file never
 * leaves the browser: lib/csv.ts parses it in place and no request is made.
 * That fact is the reason a student is willing to upload a bank statement
 * at all, so it is rendered as a permanent line inside the control rather
 * than as a footnote — `privacyNote` is required, not optional.
 *
 * DRAG AND DROP IS THE SECOND INPUT, NEVER THE ONLY ONE. The whole zone is
 * a label wrapping a real file input, so it is reachable by keyboard, has a
 * proper accessible name, and works on a phone where there is nothing to
 * drag. The drag handlers are an enhancement on top of that.
 *
 * The drag-over state changes the ground and the border, never the layout —
 * a zone that grows when a file is over it moves the target out from under
 * the pointer.
 */

export function DropZone({
  label,
  hint,
  privacyNote,
  accept = ".csv,text/csv",
  onFile,
  disabled = false,
  /** Rendered under the control — a template download, a format note. */
  footer,
  className,
}: {
  label: string;
  hint?: string;
  /** Required. Say where the file goes, in one sentence. */
  privacyNote: string;
  accept?: string;
  onFile: (file: File) => void;
  disabled?: boolean;
  footer?: React.ReactNode;
  className?: string;
}) {
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function take(list: FileList | null) {
    const file = list?.[0];
    if (file) onFile(file);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 border border-dashed px-4 py-8 text-center",
          "transition-colors duration-(--dur-fast) ease-(--ease-out)",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-line-strong",
          over
            ? "border-line-strong bg-surface"
            : "border-line-strong bg-transparent hover:bg-surface",
          disabled && "cursor-not-allowed border-line bg-surface-sunken",
        )}
      >
        <Upload
          className="lucide size-6 text-ink-secondary"
          aria-hidden="true"
        />
        <span className="type-subhead text-ink">{label}</span>
        {hint ? (
          <span className="type-body prose-measure text-ink-secondary">
            {hint}
          </span>
        ) : null}
        <span className="type-label text-ink-muted">{privacyNote}</span>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only-text"
          onChange={(e) => {
            take(e.target.files);
            // Reset, so choosing the same file twice fires again — a student
            // who fixed the file and re-picked it must not get silence.
            e.target.value = "";
          }}
        />
      </label>

      {footer}
    </div>
  );
}
