"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  useSyncExternalStore,
} from "react";
import type { ProjectionParams, ProjectionPoint } from "@/lib/sip";
import type { ParsedTxn, SpendCategory } from "@/lib/csv";
import { healthScore, ratios, type Health, type BucketRatios } from "@/lib/finance";
import { createPersistedStore } from "@/lib/persist";
import { apiJson, describeApiFailure } from "@/lib/api";

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type Txn = {
  id: number;
  date: string;
  merchant: string;
  amount: number;
  category: string;
};

export type Spending = {
  allowance: number;
  totals: Record<string, number>;
  spent: number;
  wants_pct: number;
  triggered: boolean;
  monthly_excess: number;
  projection: ProjectionPoint[];
  ten_year_value: number;
  projection_params: ProjectionParams;
  transactions: Txn[];
};

export type ProfileId = "student" | "early" | "custom";

export type Profile = {
  id: ProfileId;
  label: string;
  sub: string;
  allowance: number;
  age: number;
};

export const PROFILES: Record<Exclude<ProfileId, "custom">, Profile> = {
  student: {
    id: "student",
    label: "Student / Intern",
    sub: "₹15,000 / month",
    allowance: 15000,
    age: 21,
  },
  early: {
    id: "early",
    label: "Early Career",
    sub: "₹60,000 / month",
    allowance: 60000,
    age: 25,
  },
};

const profileStore = createPersistedStore<Profile>(
  "finpath-profile",
  PROFILES.student,
);
const tasksStore = createPersistedStore<Record<string, boolean>>(
  "finpath-roadmap",
  {},
);

type Ctx = {
  profile: Profile;
  setProfile: (id: ProfileId, allowance?: number) => void;

  data: Spending | null;
  loading: boolean;
  error: string | null;
  reload: () => void;

  /** CSV-uploaded ledger. When present it overrides the simulated feed. */
  uploaded: ParsedTxn[] | null;
  setUploaded: (t: ParsedTxn[] | null) => void;
  /** Move one uploaded row into a bucket. Marks it user-assigned. */
  assignCategory: (id: number, category: SpendCategory) => void;

  /**
   * Spend totals in force — uploaded if present, else simulated. Carries
   * Needs/Wants/Savings/Uncategorised only: money coming IN is not spend and
   * is reported separately as `income`.
   */
  totals: Record<string, number>;
  /** Credits in the uploaded ledger. Always 0 for the simulated feed. */
  income: number;
  /** Rows still sitting in the Uncategorised bucket, newest first. */
  uncategorised: ParsedTxn[];
  transactions: Txn[];
  ratio: BucketRatios;
  health: Health;

  done: Record<string, boolean>;
  toggleTask: (id: string) => void;
};

const FinPathContext = createContext<Ctx | null>(null);

export function FinPathProvider({ children }: { children: React.ReactNode }) {
  // Persisted state reads through useSyncExternalStore: no setState in an
  // effect, and the server snapshot keeps hydration consistent.
  const profile = useSyncExternalStore(
    profileStore.subscribe,
    profileStore.get,
    profileStore.getServer,
  );
  const done = useSyncExternalStore(
    tasksStore.subscribe,
    tasksStore.get,
    tasksStore.getServer,
  );

  const [uploaded, setUploaded] = useState<ParsedTxn[] | null>(null);
  const [nonce, setNonce] = useState(0);

  // The response carries the key of the request that produced it, so
  // `loading` is derived rather than assigned inside the effect body.
  const reqKey = `${profile.allowance}:${nonce}`;
  const [res, setRes] = useState<{
    key: string;
    data: Spending | null;
    error: string | null;
  }>({ key: "", data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    const key = reqKey;

    const url = `${API}/api/spending?allowance=${profile.allowance}`;

    apiJson<Spending>(url)
      .then((d) => {
        if (!cancelled) setRes({ key, data: d, error: null });
      })
      .catch(async (err) => {
        // describeApiFailure probes /health before it blames the server, so
        // this reports what actually went wrong rather than guessing.
        const message = await describeApiFailure(err, url);
        if (!cancelled) setRes({ key, data: null, error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [reqKey, profile.allowance]);

  const loading = res.key !== reqKey;
  const data = res.key === reqKey ? res.data : null;
  const error = res.key === reqKey ? res.error : null;

  const setProfile = useCallback((id: ProfileId, allowance?: number) => {
    profileStore.set(
      id === "custom"
        ? {
            id: "custom",
            label: "Custom",
            sub: "Statement upload",
            allowance: Math.max(1000, Math.round(allowance ?? 15000)),
            age: 22,
          }
        : PROFILES[id],
    );
  }, []);

  const toggleTask = useCallback((id: string) => {
    const current = tasksStore.get();
    tasksStore.set({ ...current, [id]: !current[id] });
  }, []);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const assignCategory = useCallback(
    (id: number, category: SpendCategory) => {
      setUploaded((current) =>
        current
          ? current.map((t) =>
              t.id === id ? { ...t, category, categorySource: "user" } : t,
            )
          : current,
      );
    },
    [],
  );

  // Uploaded ledger takes precedence over the simulated feed everywhere.
  const { totals, transactions, income, uncategorised } = useMemo(() => {
    if (uploaded && uploaded.length) {
      // Credits are not spend. They are excluded from every bucket, and so
      // from the denominator the 30% Wants rule is measured against —
      // counting a ₹12,500 allowance credit as "spending" would halve the
      // ratio and stop the rule firing at all.
      const t = { Needs: 0, Wants: 0, Savings: 0, Uncategorised: 0 };
      let credited = 0;
      for (const x of uploaded) {
        if (x.direction === "in") {
          credited += x.amount;
          continue;
        }
        t[x.category as SpendCategory] += x.amount;
      }
      return {
        totals: t as Record<string, number>,
        transactions: uploaded as Txn[],
        income: credited,
        uncategorised: uploaded.filter(
          (x) => x.direction === "out" && x.category === "Uncategorised",
        ),
      };
    }
    return {
      totals: data?.totals ?? { Needs: 0, Wants: 0, Savings: 0 },
      transactions: data?.transactions ?? [],
      income: 0,
      uncategorised: [] as ParsedTxn[],
    };
  }, [uploaded, data]);

  const ratio = useMemo(
    () => ratios(totals, profile.allowance),
    [totals, profile.allowance],
  );
  const health = useMemo(
    () => healthScore(totals, profile.allowance),
    [totals, profile.allowance],
  );

  const value = useMemo<Ctx>(
    () => ({
      profile, setProfile, data, loading, error, reload,
      uploaded, setUploaded, assignCategory,
      totals, income, uncategorised, transactions, ratio, health,
      done, toggleTask,
    }),
    [
      profile, setProfile, data, loading, error, reload,
      uploaded, assignCategory, totals, income, uncategorised,
      transactions, ratio, health, done, toggleTask,
    ],
  );

  return (
    <FinPathContext.Provider value={value}>{children}</FinPathContext.Provider>
  );
}

export function useFinPath(): Ctx {
  const ctx = useContext(FinPathContext);
  if (!ctx) throw new Error("useFinPath must be used inside FinPathProvider");
  return ctx;
}
