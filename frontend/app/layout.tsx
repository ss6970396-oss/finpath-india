import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers/AuthProvider";
import { FinPathProvider } from "./providers/FinPathProvider";
import { CORPUS_PHRASE } from "@/components/ui";

/**
 * §15. Two families, self-hosted by next/font — no external request, and
 * no layout shift beyond the swap.
 *
 * Instrument Serif ships a single weight (400). That is a feature: a
 * heading cannot quietly become semibold, and every display size is the
 * same voice at a different scale.
 */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

/**
 * Inter carries every label, every control and — through `.type-data` —
 * every numeral in the product. It is here rather than a mono face because
 * §15 asks for tabular numerals, not for monospace: Inter's `tnum` gives
 * the column alignment a ledger needs while keeping prose proportional.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "FinPath — Your money. One clear next step.",
    template: "%s · FinPath",
  },
  description:
    `A financial-health companion for students in India. Score your month, find the one thing worth changing, and read answers traced to ${CORPUS_PHRASE}.`,
};

/**
 * `viewportFit: "cover"` lets the page run under a phone's rounded corners
 * and home indicator, which is what makes `env(safe-area-inset-*)` report a
 * real value. The bottom bar then pads itself with `safe-bottom`; nothing
 * else on the page sits near an edge. Width and scale keep Next's defaults.
 */
export const viewport: Viewport = {
  viewportFit: "cover",
};

/**
 * The provider stack, outermost first, and the order matters:
 *
 *   AuthProvider     owns the session. FinPath's own state is per-person,
 *                    so it has to be able to read who is signed in.
 *   FinPathProvider  owns the declared profile and the resolved figures.
 *
 * The Tooltip and Toast providers live in the (app) shell, the only place
 * either is used. Mounting them here put Base UI's floating layer on the
 * landing and auth pages, which show neither.
 *
 * There is no header or footer here. The public pages, the auth pages, the
 * onboarding flow and the signed-in app each have a different chrome, so
 * each route group draws its own — a single global header would end up
 * with a branch per route inside it, which is how a shell becomes
 * unmaintainable.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // §14: there is no dark mode. Nothing mutates <html> before React
    // attaches, so no suppressHydrationWarning is needed.
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className="type-body min-h-dvh bg-canvas text-ink">
        <AuthProvider>
          <FinPathProvider>{children}</FinPathProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
