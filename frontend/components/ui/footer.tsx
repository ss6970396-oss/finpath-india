import * as React from "react";
import Link from "next/link";
import { DisclaimerNote } from "./disclaimer";
import { CORPUS_PHRASE } from "./trust";

/**
 * SiteFooter (§36).
 *
 * One footer for the whole product — the public pages and the signed-in
 * app. Four short columns and the disclaimer, in ink on canvas.
 *
 * It carries the compliance sentence as its last line because that is the
 * one place on every page where a reader looking for "who is this and what
 * are they allowed to tell me" will look. Every link here resolves; a
 * footer full of dead hrefs is the fastest way to make a product feel like
 * a mockup.
 */

const GROUPS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Product",
    // The four NAV items, then the two places reached from them. Written
    // out rather than imported: this is a primitive, and app/ imports ui/,
    // never the reverse.
    links: [
      { href: "/home", label: "Home" },
      { href: "/plan", label: "Actions" },
      { href: "/ask", label: "Ask" },
      { href: "/spending", label: "Spending" },
      { href: "/what-if", label: "What-if" },
    ],
  },
  {
    heading: "How it works",
    links: [
      { href: "/sources", label: "Trusted sources" },
      { href: "/sources#method", label: "How we calculate" },
      { href: "/styleguide", label: "Design system" },
    ],
  },
];

const LINK =
  "type-label inline-flex min-h-11 min-w-11 items-center text-ink-secondary underline-offset-4 hover:text-ink hover:underline";

/** A footer link. Exported for the `account` slot. */
export function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className={LINK}>
        {children}
      </Link>
    </li>
  );
}

/** A footer action styled as a link — Sign out, which is not a destination. */
export function FooterAction({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button type="button" onClick={onClick} className={LINK}>
        {children}
      </button>
    </li>
  );
}

/**
 * `account` fills the Account column. It depends on the session, which a
 * primitive cannot read (ui/ never imports app/), so each shell passes it
 * in: app/components/FooterAccount.tsx. Without it the column is omitted
 * rather than guessed — a signed-in student offered "Sign in" is a footer
 * that does not know who it is talking to.
 */
export function SiteFooter({ account }: { account?: React.ReactNode }) {
  return (
    <footer className="mt-16 border-t border-line bg-canvas">
      <div className="page-shell flex flex-col gap-8 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-2 md:col-span-1">
            <p className="type-heading text-ink">FinPath</p>
            <p className="type-label prose-measure text-ink-muted">
              A financial-literacy companion for students in India, grounded
              in {CORPUS_PHRASE}.
            </p>
          </div>

          {GROUPS.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="type-eyebrow text-ink-muted">{group.heading}</h2>
              <ul className="mt-1 flex flex-col">
                {group.links.map((link) => (
                  <FooterLink key={link.href + link.label} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </ul>
            </nav>
          ))}

          {account ? (
            <nav aria-label="Account">
              <h2 className="type-eyebrow text-ink-muted">Account</h2>
              <ul className="mt-1 flex flex-col">{account}</ul>
            </nav>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-8">
          <DisclaimerNote />
          <p className="type-label text-ink-muted">
            FinPath does not hold money, execute transactions, or recommend
            any named security, scheme or product.
          </p>
        </div>
      </div>
    </footer>
  );
}
