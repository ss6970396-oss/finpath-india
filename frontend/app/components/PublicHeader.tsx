"use client";

import Link from "next/link";
import { ButtonLink, SkipLink, Wordmark } from "@/components/ui";
import { useAuth } from "../providers/AuthProvider";

/**
 * The public header (§3).
 *
 * The landing page has no product navigation, because there is no product
 * to navigate until someone signs in. Two links and one button is the whole
 * of it — a marketing header with eight items is a header nobody reads.
 *
 * The right-hand action follows the session: someone already signed in
 * should never be shown "Get started" on their own product's front page.
 *
 * It is a SECONDARY button by default. The page underneath owns the one
 * primary action (the landing hero, the 404's "Go to Home"); a filled
 * button in the masthead would make two. /sources has no action of its
 * own, so there the header CTA is the page's primary (`primary`).
 */
/**
 * `primary` makes the header's CTA the page's one primary action. Only a
 * public page with no primary of its own passes it (/sources); the landing
 * page and the 404 each have their own, so there it stays secondary.
 */
export function PublicHeader({ primary = false }: { primary?: boolean }) {
  const variant = primary ? "primary" : "secondary";
  const { status, session } = useAuth();

  return (
    <header className="border-b border-line bg-canvas">
      <SkipLink />
      <div className="page-shell flex h-14 items-center justify-between gap-4">
        <Wordmark href="/" />

        <div className="flex items-center gap-4">
          <Link
            href="/sources"
            className="type-label hidden min-h-11 items-center text-ink-secondary hover:text-ink sm:inline-flex"
          >
            Trusted sources
          </Link>

          {status === "resolved" && session ? (
            <ButtonLink href="/home" variant={variant}>
              Open FinPath
            </ButtonLink>
          ) : (
            <>
              <Link
                href="/login"
                className="type-label inline-flex min-h-11 items-center text-ink-secondary hover:text-ink"
              >
                Sign in
              </Link>
              <ButtonLink href="/signup" variant={variant}>
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
