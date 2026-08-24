"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Upload } from "lucide-react";
import { useFinPath, PROFILES, type ProfileId } from "../providers/FinPathProvider";
import { inr } from "@/lib/format";
import { Figure } from "./ui";

export default function ProfileSwitcher() {
  const { profile, setProfile } = useFinPath();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(String(profile.allowance));
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(id: ProfileId) {
    if (id === "custom") {
      const n = Number(custom);
      setProfile("custom", Number.isFinite(n) && n > 0 ? n : 15000);
    } else {
      setProfile(id);
    }
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md border border-rule bg-surface px-2.5 py-1.5 text-left transition hover:border-rule"
      >
        <span className="hidden leading-tight sm:block">
          <span className="block text-[11px] text-ink-muted">Profile</span>
          <span className="block text-[13px] font-medium text-ink">
            {profile.label}
          </span>
        </span>
        <span className="text-[13px] font-medium text-ink sm:hidden">
          <Figure>{inr(profile.allowance)}</Figure>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="scale-in absolute right-0 z-40 mt-1.5 w-72 overflow-hidden rounded-lg border border-rule bg-surface shadow-lg"
        >
          {(["student", "early"] as const).map((id) => {
            const p = PROFILES[id];
            const isActive = profile.id === id;
            return (
              <button
                key={id}
                role="menuitem"
                onClick={() => pick(id)}
                className="flex w-full items-center justify-between gap-3 border-b border-rule px-4 py-3 text-left transition hover:bg-surface"
              >
                <span>
                  <span className="block text-sm font-medium text-ink">
                    {p.label}
                  </span>
                  <span className="block text-[12px] text-ink-muted">
                    <Figure>{p.sub}</Figure>
                  </span>
                </span>
                {isActive && <Check className="h-4 w-4 shrink-0 text-accent" />}
              </button>
            );
          })}

          <div className="px-4 py-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <Upload className="h-3.5 w-3.5" /> Custom / Statement upload
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
              Set your own monthly figure, then upload a statement on the
              Spending Engine.
            </p>
            <div className="mt-2.5 flex gap-2">
              <input
                type="number"
                min={1000}
                step={500}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                aria-label="Custom monthly allowance in rupees"
                className="figure w-full rounded-md border border-rule bg-surface px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-accent"
              />
              <button
                onClick={() => pick("custom")}
                className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-paper transition hover:bg-accent"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
