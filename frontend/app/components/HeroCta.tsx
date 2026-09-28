"use client";

import { ButtonLink } from "@/components/ui";
import { useAuth } from "../providers/AuthProvider";

/**
 * The landing page's ONE primary action, which follows the session: a
 * signed-out visitor is sent to sign up (and from there to onboarding); a
 * signed-in student is sent to Home. Nobody already using FinPath should
 * be asked to "get started" on their own product's front page.
 *
 * Until the session resolves it renders the signed-out form — the common
 * case for a first visit — and switches the moment the session is known,
 * which in device mode is the first client render.
 */
export function HeroCta() {
  const { status, session } = useAuth();
  const signedIn = status === "resolved" && Boolean(session);

  return signedIn ? (
    <ButtonLink href="/home" variant="primary">
      Open FinPath
    </ButtonLink>
  ) : (
    <ButtonLink href="/signup" variant="primary">
      Find my next step
    </ButtonLink>
  );
}
