import type { Metadata } from "next";
import { Inter, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { FinPathProvider } from "./providers/FinPathProvider";
import GlobalHeader from "./components/GlobalHeader";
import GlobalFooter from "./components/GlobalFooter";

// Neo-grotesk for all UI copy.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// High-contrast editorial serif for display headings.
const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
});

// Every rupee amount and percentage renders in this face, tabular.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "FinPath India — Regulatory-grounded financial intelligence",
  description:
    "Diagnose spending, simulate compounding, and consult an AI counselor restricted to RBI, SEBI and NCFE sources.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} ${plexMono.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-canvas font-sans text-[14px] leading-relaxed text-ink-2 antialiased">
        <FinPathProvider>
          <GlobalHeader />
          {children}
          <GlobalFooter />
        </FinPathProvider>
      </body>
    </html>
  );
}
