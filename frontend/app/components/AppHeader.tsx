"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Avatar,
  Menu,
  MenuAction,
  MenuHeading,
  MenuLink,
  MenuSeparator,
  SkipLink,
  Wordmark,
  isNavActive,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { displayName, useAuth } from "../providers/AuthProvider";
import { NAV } from "./nav";

/**
 * The signed-in header (§12).
 *
 *   FinPath   Home  Actions  Ask  Profile                    [account]
 *   ─────────────────────────────────────────────────────────────────
 *
 * Slim, on the paper, with a hairline below — the masthead of a page, not
 * a toolbar. The wordmark is small and sits left; the four NAV items sit
 * beside it; the account menu is the only thing on the right.
 *
 * THE ACTIVE ITEM is marked by ink text at a heavier weight AND a 2px ink
 * bar that sits on the header's own hairline, plus `aria-current="page"`
 * for assistive tech. Never by colour alone.
 *
 * There is no search box. The old "Ask a question…" field lived here; the
 * question box now opens Home, where it leads with the student's own
 * figures, and Ask is one tap away in the nav.
 *
 * Below md the links move to the bottom bar (the same four, from NAV) and
 * the header keeps only the wordmark and the account menu.
 */
export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut, isDeviceLocal } = useAuth();

  const name = displayName(session);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas">
      <SkipLink />
      <div className="page-shell flex h-14 items-stretch gap-8">
        <div className="flex items-center">
          <Wordmark href="/home" />
        </div>

        <nav aria-label="Main" className="hidden min-w-0 flex-1 md:flex">
          <ul className="flex items-stretch gap-6">
            {NAV.map((item) => {
              const active = isNavActive(item, pathname);
              return (
                <li key={item.href} className="flex">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      // -mb-px lays the indicator bar ON the header's hairline.
                      "type-label -mb-px flex items-center border-b-2 px-1",
                      "transition-colors duration-(--dur-fast) ease-(--ease-out)",
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                      active
                        ? "border-ink font-semibold text-ink"
                        : "border-transparent text-ink-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center">
          <Menu
            label="Account"
            trigger={
              <button
                type="button"
                aria-label={`Account: ${name}`}
                className="flex min-h-11 items-center gap-2 border border-transparent px-1 hover:border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Avatar name={session?.name || name} />
                <span className="type-label hidden text-ink sm:inline">
                  {name}
                </span>
              </button>
            }
          >
            <MenuHeading
              title={session?.name || name}
              detail={session?.email}
            />
            <MenuLink href="/profile">Profile and figures</MenuLink>
            <MenuLink href="/onboarding">Update your figures</MenuLink>
            <MenuLink href="/sources">Sources and methodology</MenuLink>
            {isDeviceLocal ? (
              <div className="border-t border-line px-4 py-2">
                <p className="type-label text-ink-muted">
                  This account exists only in this browser. Nothing is stored
                  on a server.
                </p>
              </div>
            ) : null}
            <MenuSeparator />
            <MenuAction
              onClick={() => {
                void signOut().then(() => router.push("/"));
              }}
            >
              Sign out
            </MenuAction>
          </Menu>
        </div>
      </div>
    </header>
  );
}
