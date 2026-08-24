"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  BookOpen,
  MessageSquare,
  Wallet,
  Target,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { openCommandPalette } from "@/app/components/CommandPalette";

/**
 * The authed shell (Section 3.4 / 4.2): a fixed 240px rail from lg up, a
 * 56px sticky top bar plus a 64px bottom tab bar below it.
 *
 * The five tabs are the arc, in order — where the student is, how they learn,
 * how they ask, what they spend, what they are aiming at. Nothing else earns
 * a tab; everything else lives behind the avatar menu.
 */
const NAV = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/counselor", label: "Ask", icon: MessageSquare },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/goals", label: "Goals", icon: Target },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  title,
  account,
}: {
  children: ReactNode;
  /** Shown in the mobile top bar, where there is no room for the rail. */
  title?: string;
  /** Avatar menu. Everything not in the five tabs hangs off this. */
  account?: ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCommandPalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-dvh bg-paper">
      {/* ---------------------------------------------------- desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-rule bg-paper lg:flex">
        <div className="flex h-14 items-center border-b border-rule px-6">
          <Link href="/dashboard" className="label-ui rounded-sm text-ink">
            FinPath
          </Link>
        </div>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "label-ui flex items-center gap-3 rounded-md px-3 py-2",
                  "transition-colors duration-[var(--dur-fast)]",
                  active
                    ? "bg-accent-weak text-accent"
                    : "text-ink-muted hover:bg-surface hover:text-ink",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-rule p-3">
          <button
            type="button"
            onClick={openCommandPalette}
            className="label-ui flex w-full items-center gap-3 rounded-md px-3 py-2 text-ink-muted transition-colors duration-[var(--dur-fast)] hover:bg-surface hover:text-ink"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            Search
            <kbd className="tnum ml-auto text-[0.6875rem] text-ink-muted">
              ⌘K
            </kbd>
          </button>
          {account}
        </div>
      </aside>

      {/* ------------------------------------------------------- content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        {/* Mobile top bar: 56px, per Section 3.4. */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-rule bg-paper px-4 lg:hidden">
          <span className="display-md min-w-0 flex-1 truncate text-ink">
            {title ?? "FinPath"}
          </span>
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Search"
            className="rounded-md p-2 text-ink-muted"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
          {account}
        </header>

        {/* pb clears the 64px tab bar plus the home indicator. */}
        <main className="min-w-0 flex-1 px-4 pb-[calc(64px+env(safe-area-inset-bottom)+24px)] pt-6 lg:px-8 lg:pb-16">
          <div className="mx-auto w-full max-w-[1120px]">{children}</div>
        </main>
      </div>

      {/* ------------------------------------------------ mobile tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="flex h-16 items-stretch">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1",
                    active ? "text-accent" : "text-ink-muted",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="caption">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
