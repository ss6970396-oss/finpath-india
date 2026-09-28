"use client";

import { useCallback } from "react";
import { useAuth } from "../providers/AuthProvider";

/**
 * Sign out and land on the landing page — the one way every Sign out
 * control in the product does it (header menu, footer, /profile).
 *
 * A full navigation, not router.push. Clearing the session makes the (app)
 * route guard redirect to /login?next=… in an effect, and a client push
 * racing that effect lost it depending on where the button sat (the footer
 * always landed on /login, the menu on /). A document load cannot be
 * overtaken, and it also drops in-memory state — an uploaded statement
 * lives only in React state and must not survive into the next person's
 * session in the same tab.
 */
export function useSignOut(): () => void {
  const { signOut } = useAuth();
  return useCallback(() => {
    void signOut().then(() =>
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a document load is the point: see above.
      window.location.assign("/"),
    );
  }, [signOut]);
}
