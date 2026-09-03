import Link from "next/link";
import { DisclaimerNote } from "./disclaimer";

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
    links: [
      { href: "/home", label: "Home" },
      { href: "/spending", label: "Spending" },
      { href: "/plan", label: "Plan" },
      { href: "/what-if", label: "What-if" },
      { href: "/ask", label: "Ask" },
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
  {
    heading: "Account",
    links: [
      { href: "/profile", label: "Your profile" },
      { href: "/onboarding", label: "Update your figures" },
      { href: "/login", label: "Sign in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-canvas">
      <div className="page-shell flex flex-col gap-8 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-2 md:col-span-1">
            <p className="type-heading text-ink">FinPath</p>
            <p className="type-label prose-measure text-ink-muted">
              A financial-literacy companion for students in India, grounded
              in RBI, SEBI and NCFE publications.
            </p>
          </div>

          {GROUPS.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="type-eyebrow text-ink-muted">{group.heading}</h2>
              <ul className="mt-2 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="type-label text-ink-secondary underline-offset-4 hover:text-ink hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
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
