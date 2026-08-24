import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * THE SIGNATURE ELEMENT (§16) — the marginalia system.
 *
 * A left-hand gutter in which annotations sit BESIDE what they annotate,
 * the way a clause reference sits beside a statutory paragraph or a bank's
 * stamp sits in the margin of a passbook.
 *
 * It exists because §34 ("no citation, no substantive regulatory claim")
 * and §54 ("I understand why FinPath is showing me this") are both demands
 * for provenance, and both are usually answered with a tooltip or a
 * footnote — which hides the answer behind an interaction. A permanent
 * margin makes provenance structural instead: the page cannot be laid out
 * without deciding where each claim came from.
 *
 * WHAT BELONGS IN IT
 *   1. a regulatory citation — authority, document, page
 *   2. the rule or formula behind a computed figure ("30% of ₹15,000")
 *   3. a material qualification ("indicative price, as of Aug 2026")
 *   4. an as-of date for anything time-sensitive
 *
 * WHAT NEVER DOES
 *   section numbers, decorative quotes, tips, encouragement, repeated
 *   navigation, or anything the reader could not act on.
 *
 * AN EMPTY MARGIN IS CORRECT. The device earns its meaning by being
 * uncommon: a page where every paragraph has a marginal note is a page
 * where the margin means nothing.
 *
 * Below 1024px the gutter collapses and the note moves inline, above the
 * element it annotates, still muted and still preceded by a rule.
 */

export function MarginLayout({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("margin-layout", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * One annotation. Renders nothing at all when it has no children, so a
 * conditional note does not leave an empty bordered stub in the gutter.
 */
export function MarginNote({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  if (!children) return null;
  return <aside className={cn("margin-note", className)}>{children}</aside>;
}

/** The annotated content. Always the second grid cell. */
export function MarginBody({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("min-w-0", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * The shorthand: one note, one body, in one call. Most call sites want
 * this rather than the three parts.
 */
export function Annotated({
  note,
  className,
  children,
}: {
  note?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <MarginLayout className={className}>
      <MarginNote>{note}</MarginNote>
      <MarginBody>{children}</MarginBody>
    </MarginLayout>
  );
}
