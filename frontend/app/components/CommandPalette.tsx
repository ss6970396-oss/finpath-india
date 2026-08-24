"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, CornerDownLeft, LayoutGrid, Calculator, BookMarked, MessageSquare,
  Route, Wallet,
} from "lucide-react";

type Entry = {
  id: string;
  label: string;
  group: "Navigate" | "Tools" | "Regulatory";
  hint?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

/** Fired by other components (the mobile menu) to open the palette. */
export const OPEN_PALETTE_EVENT = "finpath:open-palette";

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT));
}

// `hint` carries the former system name so searching "Nudge Simulator" or
// "Regulatory Vault" still finds the page after the plain-language rename.
const ENTRIES: Entry[] = [
  { id: "nav-overview", label: "Home", group: "Navigate", hint: "Overview", href: "/", icon: LayoutGrid },
  { id: "nav-spending", label: "My Spending", group: "Navigate", hint: "Spending Engine", href: "/spending", icon: Wallet },
  { id: "nav-sim", label: "What-If", group: "Navigate", hint: "Nudge Simulator", href: "/simulator", icon: Calculator },
  { id: "nav-counselor", label: "Ask", group: "Navigate", hint: "AI Counselor", href: "/counselor", icon: MessageSquare },
  { id: "nav-vault", label: "Sources", group: "Navigate", hint: "Regulatory Vault", href: "/vault", icon: BookMarked },
  { id: "nav-roadmap", label: "My Plan", group: "Navigate", hint: "Roadmap", href: "/roadmap", icon: Route },

  { id: "t-health", label: "Financial health score", group: "Tools", hint: "50/30/20 diagnosis", href: "/spending", icon: Calculator },
  { id: "t-guilt", label: "Guilt-free spending allowance", group: "Tools", hint: "Safe-to-burn calculator", href: "/spending", icon: Calculator },
  { id: "t-upload", label: "Upload bank statement (CSV)", group: "Tools", hint: "Parsed in-browser", href: "/spending", icon: Calculator },
  { id: "t-ledger", label: "Transaction opportunity cost", group: "Tools", hint: "10-year future value per row", href: "/spending", icon: Calculator },
  { id: "t-stepup", label: "SIP step-up vs flat", group: "Tools", hint: "Cost of delay", href: "/simulator", icon: Calculator },
  { id: "t-creep", label: "Lifestyle creep and FI age", group: "Tools", hint: "Income slider", href: "/simulator", icon: Calculator },
  { id: "t-stress", label: "Crisis stress test", group: "Tools", hint: "Runway in days", href: "/simulator", icon: Calculator },
  { id: "t-habit", label: "Micro-habit equivalency", group: "Tools", hint: "Daily spend to capital", href: "/simulator", icon: Calculator },

  { id: "r-vault", label: "Browse indexed source documents", group: "Regulatory", href: "/vault", icon: BookMarked },
  { id: "r-credit", label: "Credit card minimum due trap", group: "Regulatory", hint: "Ask the counselor", href: "/counselor?q=Credit+Card+Minimum+Due+Trap", icon: MessageSquare },
  { id: "r-emergency", label: "Emergency fund sizing rules", group: "Regulatory", hint: "Ask the counselor", href: "/counselor?q=Emergency+Fund+Sizing+Rules", icon: MessageSquare },
  { id: "r-sip", label: "SIP vs lumpsum mechanics", group: "Regulatory", hint: "Ask the counselor", href: "/counselor?q=SIP+vs+Lumpsum+Mechanics", icon: MessageSquare },
  { id: "r-80c", label: "Tax saving under 80C / 80D", group: "Regulatory", hint: "Ask the counselor", href: "/counselor?q=Tax+Saving+Under+80C+80D", icon: MessageSquare },
];

/**
 * `triggerClassName` hides the trigger button at narrow widths without
 * unmounting the component — the ⌘K listener must stay alive at every size,
 * and mounting two copies would toggle two dialogs at once.
 */
export default function CommandPalette({
  triggerClassName = "",
}: {
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();

  // Resetting here rather than in an effect keeps the open transition to a
  // single render instead of a cascading one.
  const openPalette = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((wasOpen) => {
          if (!wasOpen) {
            setQuery("");
            setActive(0);
          }
          return !wasOpen;
        });
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, openPalette);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, openPalette);
    };
  }, [openPalette]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ENTRIES;
    return ENTRIES.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.hint?.toLowerCase().includes(q) ||
        e.group.toLowerCase().includes(q),
    );
  }, [query]);

  // Flat index is what the arrow keys move through; the group label is
  // attached during this pass so render stays free of mutation.
  const rows = useMemo(
    () =>
      results.map((entry, index) => ({
        entry,
        index,
        firstOfGroup: index === 0 || results[index - 1].group !== entry.group,
      })),
    [results],
  );

  const go = useCallback(
    (entry: Entry) => {
      setOpen(false);
      router.push(entry.href);
    },
    [router],
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  return (
    <>
      {/* Icon only: the header has no room for a field, and the shortcut
          hint lives inside the palette instead of beside the trigger. */}
      <button
        onClick={openPalette}
        title="Search (Ctrl+K)"
        aria-label="Search pages and tools"
        aria-keyshortcuts="Control+K Meta+K"
        className={`h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-meta transition hover:border-line-strong hover:text-ink ${triggerClassName || "inline-flex"}`}
      >
        <Search className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
          <div
            className="absolute inset-0 bg-ink/25"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="scale-in relative w-full max-w-lg overflow-hidden rounded-lg border border-line bg-surface shadow-xl"
          >
            <div className="flex items-center gap-2.5 border-b border-line px-4">
              <Search className="h-4 w-4 shrink-0 text-meta" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Search citations, calculators and tools"
                aria-label="Search citations, calculators and tools"
                className="w-full bg-transparent py-3.5 text-sm text-ink outline-none placeholder:text-meta"
              />
              <kbd className="figure hidden shrink-0 rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[10px] text-meta sm:inline">
                ⌘K
              </kbd>
            </div>

            <ul className="max-h-80 overflow-y-auto py-1.5">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-[13px] text-meta">
                  No matches for “{query}”.
                </li>
              )}
              {rows.map(({ entry: e, index: i, firstOfGroup }) => {
                return (
                  <li key={e.id}>
                    {firstOfGroup && (
                      <p className="px-4 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-meta">
                        {e.group}
                      </p>
                    )}
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(e)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                        i === active ? "bg-sage text-sage-ink" : "text-ink"
                      }`}
                    >
                      <e.icon className="h-4 w-4 shrink-0 opacity-70" />
                      <span className="min-w-0 flex-1 truncate">{e.label}</span>
                      {e.hint && (
                        <span className="hidden shrink-0 text-[11px] text-meta sm:block">
                          {e.hint}
                        </span>
                      )}
                      {i === active && (
                        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
