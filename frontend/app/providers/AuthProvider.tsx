"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createAuth, type AuthAdapter, type Session } from "@/lib/auth";
import { API } from "./FinPathProvider";

/**
 * Session state for the whole app.
 *
 * `status` is three-valued on purpose. A boolean `signedIn` cannot express
 * "we have not looked yet", and every route guard written against a
 * boolean therefore bounces a signed-in user to /login for one frame on
 * every hard reload. The guards in app/(app)/layout.tsx wait for
 * "resolved".
 */

type Status = "loading" | "resolved";

type Ctx = {
  status: Status;
  session: Session | null;
  /** True when accounts live only in this browser — surfaced in the UI. */
  isDeviceLocal: boolean;
  signIn: (email: string, password: string) => Promise<Session>;
  signUp: (name: string, email: string, password: string) => Promise<Session>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // The adapter is built exactly once, through a lazy initialiser rather
  // than at module scope. Constructing it touches no storage — every
  // localStorage read lives inside its methods — so this is safe on the
  // server, and it stays a stable identity across every re-render, which
  // is what the callbacks below depend on.
  const [adapter] = useState<AuthAdapter>(() => createAuth(API));

  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;
    adapter
      .current()
      .then((s) => {
        if (cancelled) return;
        setSession(s);
        setStatus("resolved");
      })
      .catch(() => {
        if (cancelled) return;
        setSession(null);
        setStatus("resolved");
      });
    return () => {
      cancelled = true;
    };
  }, [adapter]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const s = await adapter.signIn(email, password);
      setSession(s);
      return s;
    },
    [adapter],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const s = await adapter.signUp(name, email, password);
      setSession(s);
      return s;
    },
    [adapter],
  );

  const signOut = useCallback(async () => {
    await adapter.signOut();
    setSession(null);
  }, [adapter]);

  const requestPasswordReset = useCallback(
    (email: string) => adapter.requestPasswordReset(email),
    [adapter],
  );

  const value = useMemo<Ctx>(
    () => ({
      status,
      session,
      isDeviceLocal: adapter.isDeviceLocal,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
    }),
    [status, session, adapter, signIn, signUp, signOut, requestPasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** The greeting name. Falls back to the local part of the email. */
export function displayName(session: Session | null): string {
  if (!session) return "there";
  const trimmed = session.name.trim();
  if (trimmed) return trimmed.split(/\s+/)[0];
  return session.email.split("@")[0];
}
