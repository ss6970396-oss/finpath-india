"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, TrendingUp, X } from "lucide-react";
import CommandPalette, { openCommandPalette } from "./CommandPalette";
import ProfileSwitcher from "./ProfileSwitcher";

/**
 * Display labels are plain language; `href` and the routes behind them are
 * unchanged. The former system name survives as the page eyebrow on each
 * route and as the palette search hint.
 */
const NAV = [
  { href: "/", label: "Home" },
  { href: "/spending", label: "My Spending" },
  { href: "/simulator", label: "What-If" },
  { href: "/counselor", label: "Ask" },
  { href: "/vault", label: "Sources" },
  { href: "/roadmap", label: "My Plan" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function GlobalHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // The menu closes from its own controls (see onClick on each panel link),
  // not from an effect watching the route — that would cascade a render.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-5 py-2.5">
        {/* Mark always; wordmark only where there is room for it (>=1280). */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-forest">
            <TrendingUp className="h-4 w-4 text-on-forest" />
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-ink xl:inline">
            FinPath India
          </span>
          <span className="sr-only xl:hidden">FinPath India</span>
        </Link>

        {/* Full nav from 1024px up. */}
        <nav
          aria-label="Main"
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] transition ${
                  active
                    ? "font-medium text-ink"
                    : "text-meta hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-2.5 h-px bg-forest"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* Mounted at every width so ⌘K always works; only the trigger
              button is hidden below 1024px, where the menu carries it. */}
          <CommandPalette triggerClassName="hidden lg:inline-flex" />
          <span className="hidden lg:inline-flex">
            <ProfileSwitcher />
          </span>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-meta transition hover:border-line-strong hover:text-ink lg:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Below 1024px everything lives in the disclosure panel. */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="fade-up border-t border-line bg-surface px-5 py-3 lg:hidden"
        >
          <nav aria-label="Main" className="grid gap-0.5">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-[14px] transition ${
                    active
                      ? "bg-sage font-medium text-sage-ink"
                      : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
            <button
              onClick={() => {
                setMenuOpen(false);
                openCommandPalette();
              }}
              className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-[13px] text-meta transition hover:border-line-strong hover:text-ink"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
            <ProfileSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
