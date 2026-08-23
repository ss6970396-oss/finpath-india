"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, TrendingUp } from "lucide-react";
import CommandPalette from "./CommandPalette";
import ProfileSwitcher from "./ProfileSwitcher";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/spending", label: "Spending Engine" },
  { href: "/simulator", label: "Nudge Simulator" },
  { href: "/counselor", label: "AI Counselor" },
  { href: "/vault", label: "Regulatory Vault" },
  { href: "/roadmap", label: "Roadmap" },
] as const;

export default function GlobalHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-5 py-2.5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-forest">
            <TrendingUp className="h-4 w-4 text-on-forest" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">
            FinPath India
          </span>
          <span className="hidden items-center gap-1.5 rounded-md border border-sage-line bg-sage px-2 py-0.5 text-[10px] font-medium text-sage-ink lg:inline-flex">
            <ShieldCheck className="h-3 w-3" />
            SEBI / RBI / NCFE Verified Sources
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] transition ${
                  active
                    ? "font-medium text-ink"
                    : "text-meta hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2.5 -bottom-2.5 h-px bg-forest"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <CommandPalette />
          <ProfileSwitcher />
        </div>
      </div>

      {/* compact nav for small screens */}
      <div className="flex gap-0.5 overflow-x-auto border-t border-line px-5 py-1.5 md:hidden">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded px-2.5 py-1 text-[12px] ${
                active ? "bg-sage font-medium text-sage-ink" : "text-meta"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
