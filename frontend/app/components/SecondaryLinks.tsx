import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionLabel } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SECONDARY } from "./nav";

/**
 * The way to the two places that left the primary nav — Spending and
 * What-if — shown on Home and on Actions.
 *
 * Secondary means quieter than the one primary action, not hidden: a
 * section label, then each destination as a real link (accent, underlined
 * — links are one of the accent's four jobs) with one line saying what is
 * there. Sections are separated by a hairline, not boxed.
 */
export function SecondaryLinks({ className }: { className?: string }) {
  return (
    <nav
      aria-label="More in FinPath"
      className={cn("flex flex-col gap-2 border-t border-line pt-4", className)}
    >
      <SectionLabel>Also in FinPath</SectionLabel>
      <ul className="grid gap-4 sm:grid-cols-2">
        {SECONDARY.map((link) => (
          <li key={link.href} className="flex flex-col gap-1">
            <Link
              href={link.href}
              className="type-subhead inline-flex min-h-11 w-fit items-center gap-1 text-accent underline underline-offset-4 hover:text-ink"
            >
              {link.label}
              <ArrowRight className="lucide size-4" aria-hidden="true" />
            </Link>
            <span className="type-label text-ink-muted">{link.description}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
