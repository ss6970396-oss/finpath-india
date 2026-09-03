import { Suspense } from "react";
import type { Metadata } from "next";
import { LoadingState } from "@/components/ui";
import { Coach } from "./Coach";

export const metadata: Metadata = {
  title: "Your financial coach",
  description:
    "Ask a question and get an answer traced to RBI, SEBI and NCFE publications.",
};

export default function AskPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading your coach" lines={5} />}>
      <Coach />
    </Suspense>
  );
}
