"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingState, MobileNav, SiteFooter } from "@/components/ui";
import { AppHeader } from "../components/AppHeader";
import { NAV } from "../components/nav";
import { useAuth } from "../providers/AuthProvider";
import { useFinPath } from "../providers/FinPathProvider";

/**
 * The signed-in shell, and the route guard (§30, §31).
 *
 * THE GUARD IS THE POINT OF THIS FILE. Every page under (app) renders the
 * student's own financial position, so none of them may render before both
 * questions are answered:
 *
 *   1. is there a session?              no  -> /login, carrying `next`
 *   2. has onboarding been completed?   no  -> /onboarding
 *
 * `status` is three-valued for exactly this reason. A boolean would make
 * "not signed in" and "not looked yet" the same state, and every hard
 * reload would bounce a signed-in student to the login screen for a frame
 * before bouncing them back.
 *
 * WHAT THIS GUARD IS AND IS NOT. It is a client-side routing guard: it
 * keeps private figures off the screen and keeps the app navigable. It is
 * NOT authorisation. Nothing here would stop someone reading data they
 * should not, because with the device adapter there is no server holding
 * any. When NEXT_PUBLIC_AUTH_MODE=backend is switched on, the server's own
 * session check is the enforcement and this stays what it always was —
 * the routing half.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, session } = useAuth();
  const { onboarded } = useFinPath();

  const ready = status === "resolved";
  const allowed = ready && Boolean(session) && onboarded;

  React.useEffect(() => {
    if (!ready) return;
    if (!session) {
      // `next` is the path the student actually asked for, so signing in
      // returns them to it rather than dumping everyone on /home.
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!onboarded) router.replace("/onboarding");
  }, [ready, session, onboarded, pathname, router]);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />

      <main id="main" className="page-shell w-full flex-1 py-8 pb-24 md:pb-8">
        {allowed ? (
          children
        ) : (
          <LoadingState label="Checking your session" lines={4} />
        )}
      </main>

      <SiteFooter />

      {/* Bottom bar on phones only; the same five destinations as the
          header, so there is one mental model rather than two. */}
      <MobileNav items={NAV} currentPath={pathname} className="md:hidden" />
    </div>
  );
}
