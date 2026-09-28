"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { ProjectionParams, ProjectionPoint } from "@/lib/sip";
import type { ParsedTxn, SpendCategory } from "@/lib/csv";
import {
  guiltFree,
  healthScore,
  ratios,
  type BucketRatios,
  type GuiltFree,
  type Health,
} from "@/lib/finance";
import {
  deriveBudget,
  EMPTY_PROFILE,
  isComplete,
  type DerivedBudget,
  type FinancialProfile,
} from "@/lib/onboarding";
import { createScopedStore } from "@/lib/persist";
import { apiJson, describeApiFailure } from "@/lib/api";
import { API } from "./api-base";
import { useAuth } from "./AuthProvider";

export { API };

/**
 * The API's fallback assumptions, used only until /api/spending answers.
 * They are never written down as product constants: nudge.py owns them and
 * ships them to the client as `projection_params`, so changing the rate on
 * the server changes it here without a frontend edit.
 */
const FALLBACK_PARAMS: ProjectionParams = {
  annual_rate: 0.12,
  years: 10,
  wants_threshold: 0.3,
};

/** The backend refuses a nonsensical allowance; keep the query in range. */
const MIN_QUERY_ALLOWANCE = 1000;

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

/**
 * WHERE THE NUMBERS ON SCREEN CAME FROM.
 *
 * Every page that renders a figure also renders this, because a projection
 * built from an example month and one built from a real statement look
 * identical and mean completely different things.
 *
 *   statement  a file the student parsed in their own browser. Actuals.
 *   sample     FinPath's own sample CSV, parsed the same way. It goes
 *              through the real parser, so it is the honest way to show
 *              what an import does — and it is labelled as a sample,
 *              never as "your uploaded statement".
 *   declared   what they typed during onboarding. Their own estimate.
 *   example    the API's generated month. Illustration only, opt-in.
 */
export type DataSource = "statement" | "sample" | "declared" | "example";

export const SOURCE_LABEL: Record<DataSource, string> = {
  statement: "Your uploaded statement",
  sample: "A sample statement",
  declared: "The figures you entered",
  example: "An example month",
};

/** Where an uploaded ledger came from. */
export type UploadOrigin = "file" | "sample";

/*
 * PER ACCOUNT. Each store is keyed by the signed-in account's id
 * (`finpath.profile:<userId>`), so two device accounts in one browser never
 * see each other's figures, ticks or history. Data written under the old
 * unscoped keys is migrated once, by AuthProvider, to the first account
 * resolved or signed in — see lib/account-storage.ts.
 */
const profileStore = createScopedStore<FinancialProfile>(
  "finpath.profile",
  EMPTY_PROFILE,
);
const tasksStore = createScopedStore<Record<string, boolean>>(
  "finpath.plan",
  {},
);

/**
 * The health score as it stood the last time the student opened /home.
 *
 * This is the only history the product has, and it is written by /home
 * itself rather than assumed: with no server-side store, the honest
 * alternative to "since your last review" is not a fabricated trend, it is
 * no trend at all until there genuinely is one.
 */
export type Review = { score: number; savingsRate: number; wantsRate: number; at: string };

const reviewStore = createScopedStore<Review | null>("finpath.review", null);

/**
 * Whether an account has finished onboarding, read straight from storage.
 * For the sign-in form, which has to decide where to go in the same event
 * that established the session — before the provider has re-rendered.
 */
export function hasCompletedProfile(userId: string): boolean {
  return isComplete(profileStore.getFor(userId));
}

type Ctx = {
  /* ---- the declared profile ---- */
  profile: FinancialProfile;
  saveProfile: (next: FinancialProfile) => void;
  onboarded: boolean;
  budget: DerivedBudget;

  /* ---- what is actually in force ---- */
  source: DataSource;
  allowance: number;
  totals: Record<string, number>;
  ratio: BucketRatios;
  health: Health;
  envelope: GuiltFree;

  /* ---- the ledger, when there is one ---- */
  transactions: Txn[];
  /** Credits in an uploaded statement. Zero for every other source. */
  income: number;
  uncategorised: ParsedTxn[];
  uploaded: ParsedTxn[] | null;
  /** "sample" marks FinPath's own sample CSV, so it is never labelled as yours. */
  setUploaded: (t: ParsedTxn[] | null, origin?: UploadOrigin) => void;
  assignCategory: (id: number, category: SpendCategory) => void;

  /** Opt in to the generated month. Off by default; never silently on. */
  useExample: boolean;
  setUseExample: (on: boolean) => void;

  /* ---- the API ---- */
  params: ProjectionParams;
  data: Spending | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** Starts the /api/spending fetch. Call through `useRequestSpending`. */
  requestData: () => void;

  /* ---- the plan checklist ---- */
  done: Record<string, boolean>;
  toggleTask: (id: string) => void;

  /* ---- the one piece of history ---- */
  lastReview: Review | null;
  recordReview: (review: Review) => void;
};

const FinPathContext = createContext<Ctx | null>(null);

export function FinPathProvider({ children }: { children: React.ReactNode }) {
  // Persisted state reads through useSyncExternalStore: no setState in an
  // effect, and the server snapshot keeps hydration consistent. Every read
  // and write is for the signed-in account; signed out reads the fallback.
  const auth = useAuth();
  const userId = auth.session?.userId ?? null;
  // Until the session resolves, the profile read is the signed-out
  // fallback, so a fetch then would ask about the wrong allowance and be
  // thrown away a moment later.
  const authResolved = auth.status === "resolved";
  const profile = useSyncExternalStore(
    profileStore.subscribe,
    () => profileStore.getFor(userId),
    profileStore.getServer,
  );
  const done = useSyncExternalStore(
    tasksStore.subscribe,
    () => tasksStore.getFor(userId),
    tasksStore.getServer,
  );
  const lastReview = useSyncExternalStore(
    reviewStore.subscribe,
    () => reviewStore.getFor(userId),
    reviewStore.getServer,
  );

  const [upload, setUpload] = useState<{
    txns: ParsedTxn[];
    origin: UploadOrigin;
  } | null>(null);
  const uploaded = upload?.txns ?? null;
  const setUploaded = useCallback(
    (t: ParsedTxn[] | null, origin: UploadOrigin = "file") =>
      setUpload(t ? { txns: t, origin } : null),
    [],
  );
  const [useExample, setUseExample] = useState(false);
  const [nonce, setNonce] = useState(0);
  // Nothing is fetched until a screen that shows figures asks for it, so
  // the auth screens and /sources never call the API. Once asked, it
  // stays asked for the session.
  const [wanted, setWanted] = useState(false);
  const requestData = useCallback(() => setWanted(true), []);

  const onboarded = isComplete(profile);
  const budget = useMemo(() => deriveBudget(profile), [profile]);

  // The API is asked about the student's own income so the example month it
  // generates is at their scale rather than a stranger's.
  const queryAllowance = Math.max(
    MIN_QUERY_ALLOWANCE,
    Math.round(budget.allowance || MIN_QUERY_ALLOWANCE),
  );

  // The response carries the key of the request that produced it, so
  // `loading` is derived rather than assigned inside the effect body.
  const reqKey = `${queryAllowance}:${nonce}`;
  const [res, setRes] = useState<{
    key: string;
    data: Spending | null;
    error: string | null;
  }>({ key: "", data: null, error: null });

  useEffect(() => {
    if (!wanted || !authResolved) return;
    let cancelled = false;
    const key = reqKey;
    const url = `${API}/api/spending?allowance=${queryAllowance}`;

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
  }, [wanted, authResolved, reqKey, queryAllowance]);

  const loading = res.key !== reqKey;
  const data = res.key === reqKey ? res.data : null;
  const error = res.key === reqKey ? res.error : null;
  const params = data?.projection_params ?? FALLBACK_PARAMS;

  const saveProfile = useCallback(
    (next: FinancialProfile) => profileStore.setFor(userId, next),
    [userId],
  );

  const toggleTask = useCallback(
    (id: string) => {
      const current = tasksStore.getFor(userId);
      tasksStore.setFor(userId, { ...current, [id]: !current[id] });
    },
    [userId],
  );

  const recordReview = useCallback(
    (review: Review) => reviewStore.setFor(userId, review),
    [userId],
  );

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const assignCategory = useCallback((id: number, category: SpendCategory) => {
    setUpload((current) =>
      current
        ? {
            ...current,
            txns: current.txns.map((t) =>
              t.id === id ? { ...t, category, categorySource: "user" } : t,
            ),
          }
        : current,
    );
  }, []);

  /**
   * PRECEDENCE. Actuals beat estimates; estimates beat illustrations.
   *
   *   1. an uploaded statement, because it is what happened
   *   2. the declared profile, because the student stands behind it
   *   3. the generated example, and only when explicitly asked for
   *
   * Whichever wins, `source` says so and every page prints it.
   */
  const resolved = useMemo(() => {
    if (uploaded && uploaded.length) {
      // Credits are not spend. They are excluded from every bucket, and so
      // from the denominator the 30% Wants rule is measured against —
      // counting an allowance credit as "spending" would halve the ratio
      // and stop the rule firing at all.
      const totals = { Needs: 0, Wants: 0, Savings: 0, Uncategorised: 0 };
      let credited = 0;
      for (const t of uploaded) {
        if (t.direction === "in") {
          credited += t.amount;
          continue;
        }
        totals[t.category as SpendCategory] += t.amount;
      }
      return {
        source: (upload?.origin === "sample" ? "sample" : "statement") as DataSource,
        // A statement says what left the account, not what arrives each
        // month. The declared income stays the denominator unless there is
        // none, in which case the credits in the file are the best estimate.
        allowance: budget.allowance > 0 ? budget.allowance : credited,
        totals: totals as Record<string, number>,
        transactions: uploaded as Txn[],
        income: credited,
        uncategorised: uploaded.filter(
          (t) => t.direction === "out" && t.category === "Uncategorised",
        ),
      };
    }

    if (useExample && data) {
      return {
        source: "example" as DataSource,
        allowance: data.allowance,
        totals: data.totals,
        transactions: data.transactions,
        income: 0,
        uncategorised: [] as ParsedTxn[],
      };
    }

    return {
      source: "declared" as DataSource,
      allowance: budget.allowance,
      totals: budget.totals as Record<string, number>,
      transactions: [] as Txn[],
      income: 0,
      uncategorised: [] as ParsedTxn[],
    };
  }, [uploaded, upload?.origin, useExample, data, budget]);

  const { source, allowance, totals, transactions, income, uncategorised } =
    resolved;

  const ratio = useMemo(() => ratios(totals, allowance), [totals, allowance]);
  const health = useMemo(
    () => healthScore(totals, allowance),
    [totals, allowance],
  );
  const envelope = useMemo(
    () => guiltFree(totals, allowance),
    [totals, allowance],
  );

  const value = useMemo<Ctx>(
    () => ({
      profile, saveProfile, onboarded, budget,
      source, allowance, totals, ratio, health, envelope,
      transactions, income, uncategorised,
      uploaded, setUploaded, assignCategory,
      useExample, setUseExample,
      params, data, loading, error, reload, requestData,
      done, toggleTask,
      lastReview, recordReview,
    }),
    [
      profile, saveProfile, onboarded, budget,
      source, allowance, totals, ratio, health, envelope,
      transactions, income, uncategorised,
      uploaded, setUploaded, assignCategory, useExample,
      params, data, loading, error, reload, requestData,
      done, toggleTask, lastReview, recordReview,
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

/**
 * Declares that this screen shows figures from /api/spending. The fetch
 * starts on first use and `loading` stays true until it answers, so a
 * screen that calls this never flashes an empty state first.
 */
export function useRequestSpending(): void {
  const { requestData } = useFinPath();
  useEffect(() => requestData(), [requestData]);
}
