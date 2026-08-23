import Link from "next/link";
import { TrendingUp } from "lucide-react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/counselor", label: "Counselor" },
  { href: "/dashboard", label: "Spending" },
] as const;

/**
 * The compact hero band the two inner pages share, carrying the landing
 * page's visual language: Archivo black uppercase title, slate-950 ground,
 * one hairline rule underneath. `active` is dropped from the nav so each
 * page links only to the other two.
 */
export default function PageHeader({
  title,
  subtitle,
  active,
  width = "max-w-5xl",
  compact = false,
}: {
  title: string;
  subtitle: string;
  active: string;
  width?: string;
  compact?: boolean;
}) {
  return (
    <header className="border-b border-slate-900 bg-slate-950">
      <div
        className={`mx-auto flex ${width} items-center justify-between px-8 py-6`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500">
            <TrendingUp className="h-4 w-4 text-slate-950" />
          </div>
          <span className="text-sm font-extrabold uppercase tracking-[0.15em] text-slate-100">
            FinPath India
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {NAV.filter((item) => item.href !== active).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-slate-800 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 transition hover:border-emerald-500/60 hover:text-emerald-400"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div
        className={`mx-auto ${width} px-8 ${compact ? "pb-7" : "pb-12"} pt-1`}
      >
        <h1 className="text-[clamp(1.75rem,4.5vw,2.75rem)] font-black uppercase leading-[0.95] tracking-tight text-slate-100">
          {title}
        </h1>
        <p className="mt-3 text-sm text-slate-400">{subtitle}</p>
      </div>
    </header>
  );
}
