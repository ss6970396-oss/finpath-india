import { Suspense } from "react";
import type { Metadata } from "next";
import { LoadingState } from "@/components/ui";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create a FinPath account and build a plan from your own figures.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading the sign-up form" />}>
      <SignupForm />
    </Suspense>
  );
}
