"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

/**
 * Header (§20).
 *
 * Two jobs, one component:
 *   - on the public pages it carries the wordmark and the sign-in action
 *   - on /app it carries the wordmark, the mobile menu trigger, and the
 *     signed-in user
 *
 * The wordmark is set in the display serif and is the product's name, not a
 * logo. FinPath has no mark, and inventing one would be the first piece of
 * decoration in a system that has none.
 *
 * The skip link is the first focusable element on the page — §39 needs a
 * way past the navigation, and it is only ever noticed by the people who
 * need it.
 */

export function SkipLink({ href = "#main" }: { href?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "type-label sr-only-text",
        // Becomes visible only on keyboard focus.
        "focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50",
        "focus:border focus:border-line-strong focus:bg-canvas focus:px-2 focus:py-2 focus:text-ink",
      )}
    >
      Skip to content
    </a>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="type-heading text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
    >
      FinPath
    </Link>
  );
}

export function Header({
  /** Left of the wordmark on mobile — the menu trigger for the app shell. */
  leading,
  /** Right-hand actions: sign in, or the user block. */
  actions,
  user,
  className,
}: {
  leading?: React.ReactNode;
  actions?: React.ReactNode;
  user?: { name: string };
  className?: string;
}) {
  return (
    <header
      className={cn("w-full border-b border-line bg-canvas", className)}
    >
      <SkipLink />
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {leading}
          <Wordmark />
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {actions}
          {user ? (
            <span className="flex items-center gap-2">
              <Avatar name={user.name} />
              <span className="type-label hidden text-ink sm:inline">
                {user.name}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
