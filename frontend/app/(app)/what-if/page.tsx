import { Suspense } from "react";
import type { Metadata } from "next";
import { LoadingState } from "@/components/ui";
import { ScenarioExplorer } from "./ScenarioExplorer";

export const metadata: Metadata = {
  title: "Explore scenarios",
  description:
    "See what a monthly amount becomes, and what raising it or delaying it does.",
};

/**
 * `useSearchParams` — /spending hands this page a monthly figure — so the
 * interactive half sits inside its own Suspense boundary. Next 16 requires
 * it; without one the production build fails outright.
 */
export default function WhatIfPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading the scenario explorer" lines={6} />}>
      <ScenarioExplorer />
    </Suspense>
  );
}
