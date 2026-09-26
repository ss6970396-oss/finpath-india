import { Suspense } from "react";
import type { Metadata } from "next";
import { CORPUS_PHRASE, LoadingState } from "@/components/ui";
import { Coach } from "./Coach";

export const metadata: Metadata = {
  title: "Your financial coach",
  description:
    `Ask a question and get an answer traced to ${CORPUS_PHRASE}.`,
};

export default function AskPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading your coach" lines={5} />}>
      <Coach />
    </Suspense>
  );
}
