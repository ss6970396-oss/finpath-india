"use client";

import { useAuth } from "../providers/AuthProvider";

/**
 * The honesty notice on every auth screen (§29).
 *
 * The FastAPI backend ships no authentication routes, so out of the box
 * FinPath signs people in against an account that exists only in their own
 * browser. That is a perfectly reasonable way to run a demo — and it would
 * be indefensible to let a student believe their password is protecting
 * something on a server when it is not.
 *
 * So the screen says which mode it is in. It disappears the moment
 * NEXT_PUBLIC_AUTH_MODE=backend points the same forms at a real server.
 */
export function DeviceAccountNote() {
  const { isDeviceLocal } = useAuth();
  if (!isDeviceLocal) return null;

  return (
    <div className="border border-line bg-surface px-4 py-4">
      <h2 className="type-label text-ink">About accounts on this build</h2>
      <p className="type-body prose-measure mt-1 text-ink-secondary">
        This installation has no authentication server, so your account and
        everything you enter live in this browser and nowhere else. Your
        password is never stored — only a one-way hash of it, used to check
        the next sign-in. Clearing site data removes the account, and it will
        not follow you to another device.
      </p>
    </div>
  );
}
