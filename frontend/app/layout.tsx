import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Devanagari,
  Newsreader,
} from "next/font/google";
import "./globals.css";
import { FinPathProvider } from "./providers/FinPathProvider";
import GlobalHeader from "./components/GlobalHeader";
import GlobalFooter from "./components/GlobalFooter";
import { THEME_SCRIPT } from "@/lib/theme";

// Section 3.3. Newsreader is variable, so its optical-size axis tracks the
// rendered size automatically (font-optical-sizing: auto in globals.css).
const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-sans",
});

// Sits directly after plexSans in --font-sans so Devanagari glyphs resolve
// without any language-specific class on the element.
const plexDeva = IBM_Plex_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-deva",
});

// Every rupee amount and percentage renders in this face, tabular.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "FinPath India — Regulatory-grounded financial intelligence",
  description:
    "Diagnose spending, simulate compounding, and consult an AI counsellor restricted to RBI, SEBI and NCFE sources.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexDeva.variable} ${newsreader.variable} ${plexMono.variable}`}
    >
      <head>
        {/* Resolves the stored theme before first paint so System/Light/Dark
            never flashes the wrong ground. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="body-base flex min-h-dvh flex-col bg-paper text-ink">
        <FinPathProvider>
          <GlobalHeader />
          {children}
          <GlobalFooter />
        </FinPathProvider>
      </body>
    </html>
  );
}
