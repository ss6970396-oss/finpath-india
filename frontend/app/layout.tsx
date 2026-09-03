import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers/AuthProvider";
import { FinPathProvider } from "./providers/FinPathProvider";
import { ToastProvider, TooltipProvider } from "@/components/ui";

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
    default: "FinPath — See where your money is going",
    template: "%s · FinPath",
  },
  description:
    "A financial-health companion for students in India. Score your month, find the one thing worth changing, and read answers traced to RBI, SEBI and NCFE sources.",
};

/**
 * The provider stack, outermost first, and the order matters:
 *
 *   AuthProvider     owns the session. FinPath's own state is per-person,
 *                    so it has to be able to read who is signed in.
 *   FinPathProvider  owns the declared profile and the resolved figures.
 *   Tooltip/Toast    Base UI providers; portals only, no data.
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
          <FinPathProvider>
            <TooltipProvider>
              <ToastProvider>{children}</ToastProvider>
            </TooltipProvider>
          </FinPathProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
