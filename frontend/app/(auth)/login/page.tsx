import { Suspense } from "react";
import type { Metadata } from "next";
import { LoadingState } from "@/components/ui";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to FinPath to see your financial health.",
};

/**
 * `useSearchParams` opts the subtree into client rendering, so the form is
 * wrapped in its own Suspense boundary rather than making the whole route
 * dynamic. Next 16 requires the boundary; without it the build fails.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading the sign-in form" />}>
      <LoginForm />
    </Suspense>
  );
}
