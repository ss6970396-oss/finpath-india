/**
 * `?next=` is where to send someone after they sign in, sign up or finish
 * onboarding. It arrives in a URL, so anyone can write it: `//evil.example`
 * and `https://evil.example` must never become a redirect. Only a path on
 * this site is accepted, and never the auth or onboarding pages themselves
 * (sending someone back to the form they just completed is a loop).
 */
const LOOPS = ["/login", "/signup", "/forgot-password", "/onboarding"];

export function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // One leading slash, then not a second slash or a backslash (which some
  // browsers normalise to "//"), and no scheme anywhere before the path.
  if (!/^\/(?![/\\])/.test(raw)) return null;
  if (/[\r\n\t]/.test(raw)) return null;
  const path = raw.split(/[?#]/)[0];
  if (LOOPS.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return raw;
}
