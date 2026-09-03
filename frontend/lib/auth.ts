/**
 * Authentication.
 *
 * ── READ THIS BEFORE SHIPPING ──────────────────────────────────────────
 *
 * The FastAPI backend in `backend/` exposes no authentication endpoints.
 * Rather than invent a fake sign-in that pretends otherwise, this module
 * defines the CONTRACT the UI talks to, and ships two implementations of
 * it:
 *
 *   httpAuth   the real one. POSTs to `${API}/api/auth/*` and holds
 *              nothing but the session the server hands back. Selected by
 *              NEXT_PUBLIC_AUTH_MODE=backend. Turn it on the day those
 *              routes exist; no screen changes.
 *
 *   deviceAuth the default, and the honest name for what it is: accounts
 *              that live in THIS BROWSER and nowhere else. It exists so
 *              the product can be demonstrated end to end without a users
 *              table.
 *
 * What deviceAuth does NOT do, deliberately:
 *
 *   - it never stores a password. It stores a per-account random salt and
 *     a PBKDF2-SHA-256 verifier (210,000 iterations, the OWASP 2023
 *     figure). Sign-in re-derives and compares.
 *   - it ships no accounts. There are no seeded credentials to find,
 *     because there is nothing in here to seed.
 *
 * What it is NOT is secure. A verifier sitting in localStorage next to the
 * code that checks it is a lock on the inside of the door: it protects a
 * password that someone reused elsewhere, and nothing else. Every screen
 * that uses it says so. Real authorisation has to be enforced server-side,
 * which is exactly what the `httpAuth` half is for.
 */

import { apiJson } from "./api";

/* ------------------------------------------------------------------ types */

export type Session = {
  userId: string;
  name: string;
  email: string;
  /** ISO instant the session was established. */
  issuedAt: string;
};

export type AuthErrorCode =
  | "invalid-credentials"
  | "email-taken"
  | "unknown-email"
  | "weak-password"
  | "unavailable";

/** Thrown by every adapter. `code` is what the form branches on; `message` is shown. */
export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

export interface AuthAdapter {
  /** The signed-in session, or null. Never throws. */
  current(): Promise<Session | null>;
  signIn(email: string, password: string): Promise<Session>;
  signUp(name: string, email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
  /**
   * Starts a reset. Resolves whether or not the address is registered —
   * an endpoint that distinguishes them is an account-enumeration oracle.
   */
  requestPasswordReset(email: string): Promise<void>;
  /** True when accounts are local to this browser, so the UI can say so. */
  readonly isDeviceLocal: boolean;
}

/* ------------------------------------------------------------- validation */

export const MIN_PASSWORD_LENGTH = 10;

/**
 * Deliberately permissive. Address validity is decided by whether mail
 * arrives, and a clever regex only ever rejects somebody's real address.
 */
export function isEmailShaped(value: string): boolean {
  const v = value.trim();
  return v.length >= 5 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function passwordProblem(value: string): string | null {
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (/^\d+$/.test(value)) return "Digits alone are quick to guess. Add words.";
  return null;
}

export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

/* ------------------------------------------------------------ persistence */

const SESSION_KEY = "finpath.session";
const ACCOUNTS_KEY = "finpath.accounts";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota). The session still works
    // for this tab; it simply will not survive a reload.
  }
}

/* ---------------------------------------------------------------- crypto */

type StoredAccount = {
  userId: string;
  name: string;
  email: string;
  /** base64 */
  salt: string;
  /** base64 PBKDF2-SHA-256 verifier. NOT the password. */
  verifier: string;
  iterations: number;
  createdAt: string;
};

const PBKDF2_ITERATIONS = 210_000;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  crypto.getRandomValues(out);
  return out;
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

/**
 * Constant-time-ish comparison. The strings are equal-length base64 of a
 * fixed-width digest, so a length check is not itself a leak.
 */
function verifierMatches(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* --------------------------------------------------------- device adapter */

export function createDeviceAuth(): AuthAdapter {
  function accounts(): StoredAccount[] {
    return readJson<StoredAccount[]>(ACCOUNTS_KEY, []);
  }

  function sessionFor(account: StoredAccount): Session {
    return {
      userId: account.userId,
      name: account.name,
      email: account.email,
      issuedAt: new Date().toISOString(),
    };
  }

  return {
    isDeviceLocal: true,

    async current() {
      const session = readJson<Session | null>(SESSION_KEY, null);
      if (!session?.userId) return null;
      // An account deleted underneath a stale session must not stay signed in.
      return accounts().some((a) => a.userId === session.userId)
        ? session
        : null;
    },

    async signIn(email, password) {
      const target = normaliseEmail(email);
      const account = accounts().find((a) => a.email === target);

      // The same message and the same work either way: branching early on a
      // missing account tells an attacker which addresses are registered.
      const salt = account ? fromBase64(account.salt) : randomBytes(16);
      const iterations = account?.iterations ?? PBKDF2_ITERATIONS;
      const attempt = await derive(password, salt, iterations);

      if (!account || !verifierMatches(attempt, account.verifier)) {
        throw new AuthError(
          "invalid-credentials",
          "That email and password don't match an account on this device.",
        );
      }

      const session = sessionFor(account);
      writeJson(SESSION_KEY, session);
      return session;
    },

    async signUp(name, email, password) {
      const target = normaliseEmail(email);
      const problem = passwordProblem(password);
      if (problem) throw new AuthError("weak-password", problem);

      const existing = accounts();
      if (existing.some((a) => a.email === target)) {
        throw new AuthError(
          "email-taken",
          "An account with that email already exists on this device. Sign in instead.",
        );
      }

      const salt = randomBytes(16);
      const account: StoredAccount = {
        userId: toBase64(randomBytes(12)),
        name: name.trim(),
        email: target,
        salt: toBase64(salt),
        verifier: await derive(password, salt, PBKDF2_ITERATIONS),
        iterations: PBKDF2_ITERATIONS,
        createdAt: new Date().toISOString(),
      };

      writeJson(ACCOUNTS_KEY, [...existing, account]);
      const session = sessionFor(account);
      writeJson(SESSION_KEY, session);
      return session;
    },

    async signOut() {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
        // nothing to clear
      }
    },

    async requestPasswordReset() {
      // There is no mail transport in a browser, and inventing a "check your
      // inbox" screen that sends nothing would be the one outright lie in
      // the product. The screen that calls this says what actually happens.
      return;
    },
  };
}

/* ----------------------------------------------------------- http adapter */

type AuthResponse = { user: { id: string; name: string; email: string } };

/**
 * The production adapter. Session state is the server's — this holds a
 * cached copy for rendering only, and `credentials: "include"` means the
 * actual credential is an HttpOnly cookie the page cannot read. No token
 * is ever put in localStorage.
 */
export function createHttpAuth(base: string): AuthAdapter {
  const post = async (path: string, body: unknown): Promise<AuthResponse> =>
    apiJson<AuthResponse>(`${base}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const toSession = (res: AuthResponse): Session => ({
    userId: res.user.id,
    name: res.user.name,
    email: res.user.email,
    issuedAt: new Date().toISOString(),
  });

  return {
    isDeviceLocal: false,

    async current() {
      try {
        const res = await apiJson<AuthResponse>(`${base}/api/auth/session`, {
          credentials: "include",
        });
        return toSession(res);
      } catch {
        return null;
      }
    },

    async signIn(email, password) {
      try {
        return toSession(
          await post("/api/auth/sign-in", {
            email: normaliseEmail(email),
            password,
          }),
        );
      } catch {
        throw new AuthError(
          "invalid-credentials",
          "That email and password don't match an account.",
        );
      }
    },

    async signUp(name, email, password) {
      const problem = passwordProblem(password);
      if (problem) throw new AuthError("weak-password", problem);
      try {
        return toSession(
          await post("/api/auth/sign-up", {
            name: name.trim(),
            email: normaliseEmail(email),
            password,
          }),
        );
      } catch {
        throw new AuthError(
          "email-taken",
          "That account could not be created. The email may already be registered.",
        );
      }
    },

    async signOut() {
      try {
        await post("/api/auth/sign-out", {});
      } catch {
        // Signing out locally must succeed even when the server does not.
      }
    },

    async requestPasswordReset(email) {
      try {
        await post("/api/auth/forgot-password", { email: normaliseEmail(email) });
      } catch {
        // Resolves either way: a differing response is an enumeration oracle.
      }
    },
  };
}

/* ----------------------------------------------------------------- choice */

/**
 * `NEXT_PUBLIC_AUTH_MODE=backend` switches the whole product onto the real
 * adapter. It is read at module scope because it is a build-time constant,
 * and inlined by Next either way.
 */
export function createAuth(apiBase: string): AuthAdapter {
  return process.env.NEXT_PUBLIC_AUTH_MODE === "backend"
    ? createHttpAuth(apiBase)
    : createDeviceAuth();
}
