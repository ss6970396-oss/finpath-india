import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { FinPathProvider } from "./providers/FinPathProvider";
import GlobalHeader from "./components/GlobalHeader";
import GlobalFooter from "./components/GlobalFooter";

/**
 * §13. Two families, self-hosted by next/font — no external request, and
 * no layout shift beyond the swap.
 *
 * Instrument Serif ships a single weight (400). That is a feature: it means
 * a heading cannot quietly become semibold, and every display size is the
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
 * §13 asks for tabular numerals, not for monospace: Inter's `tnum` gives
 * the column alignment a ledger needs while keeping prose proportional.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FinPath — Understand your money",
  description:
    "A regulatory-grounded financial-literacy platform for Indian college students. Diagnose spending, simulate scenarios, and read answers traced to RBI, SEBI and NCFE sources.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // §11: there is no dark mode. The theme-resolution script that used to
    // run here before first paint is gone along with it, so `<html>` needs
    // no suppressHydrationWarning: nothing mutates it before React attaches.
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className="type-body flex min-h-dvh flex-col bg-canvas text-ink">
        <FinPathProvider>
          <GlobalHeader />
          {children}
          <GlobalFooter />
        </FinPathProvider>
      </body>
    </html>
  );
}
