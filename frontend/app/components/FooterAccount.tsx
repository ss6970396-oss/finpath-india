"use client";

import { FooterAction, FooterLink } from "@/components/ui";
import { useAuth } from "../providers/AuthProvider";
import { useSignOut } from "./useSignOut";

/**
 * The footer's Account column, which is the one part of the footer that
 * depends on who is reading it. Signed in: your profile, your figures and
 * Sign out — never "Sign in". Signed out: Sign in and Create an account.
 *
 * Nothing renders until the session resolves, so a signed-in student never
 * sees "Sign in" flash on a hard reload (the reason AuthProvider.status is
 * three-valued).
 */
export function FooterAccount() {
  const { status, session } = useAuth();
  const signOut = useSignOut();
  if (status !== "resolved") return null;

  if (session) {
    return (
      <>
        <FooterLink href="/profile">Your profile</FooterLink>
        <FooterLink href="/onboarding">Update your figures</FooterLink>
        <FooterAction onClick={signOut}>
          Sign out
        </FooterAction>
      </>
    );
  }

  return (
    <>
      <FooterLink href="/login">Sign in</FooterLink>
      <FooterLink href="/signup">Create an account</FooterLink>
    </>
  );
}
