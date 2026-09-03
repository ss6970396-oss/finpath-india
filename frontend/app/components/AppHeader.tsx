"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Avatar,
  Menu,
  MenuAction,
  MenuHeading,
  MenuLink,
  MenuSeparator,
  SkipLink,
  Wordmark,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { displayName, useAuth } from "../providers/AuthProvider";
import { NAV } from "./nav";

/**
 * The signed-in header (§12).
 *
 *   FinPath | Home  Spending  Plan  What-if  Ask        [search] [account]
 *
 * THE ACTIVE STATE IS DELIBERATELY QUIET. §12 asks for no heavy underline,
 * so the current item is marked by ink weight and colour against muted
 * neighbours, plus `aria-current="page"` — which is the marker that
 * actually matters, and the only one a screen reader gets. The 2px bar
 * lives on the mobile bar instead, where there is no hover to disambiguate.
 *
 * THE SEARCH FIELD IS NOT A SEARCH ENGINE. There is no index of the
 * student's own pages to search, and a box that pretends otherwise would be
 * the product's first lie. It asks the coach: whatever is typed becomes the
 * opening question on /ask, which is a real destination for a real
 * sentence. The label says so.
 */
export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut, isDeviceLocal } = useAuth();
  const [query, setQuery] = React.useState("");

  const name = displayName(session);

  function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/ask?q=${encodeURIComponent(q)}` : "/ask");
    setQuery("");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas">
      <SkipLink />
      <div className="page-shell flex h-16 items-center gap-8">
        <Wordmark href="/home" />

        <nav aria-label="Main" className="hidden min-w-0 flex-1 md:block">
          <ul className="flex items-center gap-6">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "type-label py-2",
                      "transition-colors duration-(--dur-fast) ease-(--ease-out)",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong",
                      active
                        ? "font-semibold text-ink"
                        : "text-ink-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <form onSubmit={ask} className="hidden lg:block">
            <label htmlFor="header-ask" className="sr-only-text">
              Ask your financial coach a question
            </label>
            <div className="flex items-center gap-2 border border-line-strong px-2">
              <Search
                className="lucide size-4 shrink-0 text-ink-muted"
                aria-hidden="true"
              />
              <input
                id="header-ask"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question…"
                className="type-body w-56 bg-transparent py-2 text-ink placeholder:text-ink-muted focus:outline-none"
              />
            </div>
          </form>

          <Menu
            label="Account"
            trigger={
              <button
                type="button"
                aria-label={`Account: ${name}`}
                className="flex items-center gap-2 border border-transparent p-1 hover:border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-strong"
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
