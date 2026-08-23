import { ShieldCheck, Lock, FileWarning, Landmark } from "lucide-react";

const BLOCKS = [
  {
    icon: ShieldCheck,
    title: "Grounded sources only",
    body: "Counselor answers are restricted to the RBI, SEBI and NCFE publications held in the indexed corpus, and every claim carries a document and page citation. Where the index has no support, it declines to answer.",
  },
  {
    icon: Landmark,
    title: "Sahamati Account Aggregator",
    body: "Production connectivity is designed for the RBI-regulated Account Aggregator framework: consent is explicit, time-bound, purpose-limited and revocable, and data flows only between regulated entities.",
  },
  {
    icon: Lock,
    title: "Data privacy",
    body: "No SMS scraping and no screen scraping. Uploaded statements are parsed entirely in your browser and are never transmitted to the API or written to disk.",
  },
  {
    icon: FileWarning,
    title: "Non-advisory",
    body: "This is an educational tool. It is not investment, tax or legal advice, and it does not recommend any specific security, scheme or institution. Consult a SEBI-registered investment adviser before acting.",
  },
];

export default function GlobalFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-canvas-alt">
      <div className="mx-auto max-w-[1400px] px-5 py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BLOCKS.map((b) => (
            <div key={b.title}>
              <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                <b.icon className="h-3.5 w-3.5 shrink-0 text-meta" />
                {b.title}
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-meta">
                {b.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-[12px] text-meta sm:flex-row sm:items-center sm:justify-between">
          <p>
            FinPath India · Suraj Pratap Singh · MVSR Engineering College,
            Dept. of CSIT
          </p>
          <p>Simulated data for demonstration. Educational use only.</p>
        </div>
      </div>
    </footer>
  );
}
