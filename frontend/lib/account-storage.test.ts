import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ACCOUNT_KEYS,
  migrateLegacyKeys,
  scopedKey,
  type StorageLike,
} from "./account-storage";
import { createScopedStore } from "./persist";
import { safeNext } from "./safe-next";

/** An in-memory Storage, enough for these modules. */
function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  const storage: StorageLike & { dump: () => Record<string, string> } = {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    dump: () => Object.fromEntries(map),
  };
  return storage;
}

describe("scopedKey", () => {
  it("suffixes the account id", () => {
    expect(scopedKey("finpath.profile", "u1")).toBe("finpath.profile:u1");
  });
});

describe("migrateLegacyKeys — the one-time migration", () => {
  const legacy = {
    "finpath.profile": '{"monthlyIncome":15000}',
    "finpath.plan": '{"debt-clear":true}',
    "finpath.review": '{"score":62}',
  };

  it("moves every legacy key to the account and removes the originals", () => {
    const s = memoryStorage(legacy);
    expect(migrateLegacyKeys(s, "u1")).toEqual([...ACCOUNT_KEYS]);
    expect(s.dump()).toEqual({
      "finpath.profile:u1": '{"monthlyIncome":15000}',
      "finpath.plan:u1": '{"debt-clear":true}',
      "finpath.review:u1": '{"score":62}',
    });
  });

  it("is claimed exactly once: a second account gets nothing", () => {
    const s = memoryStorage(legacy);
    migrateLegacyKeys(s, "u1");
    expect(migrateLegacyKeys(s, "u2")).toEqual([]);
    expect(s.getItem("finpath.profile:u2")).toBeNull();
  });

  it("is idempotent for the same account", () => {
    const s = memoryStorage(legacy);
    migrateLegacyKeys(s, "u1");
    const before = s.dump();
    expect(migrateLegacyKeys(s, "u1")).toEqual([]);
    expect(s.dump()).toEqual(before);
  });

  it("never overwrites data the account already has, and still retires the legacy key", () => {
    const s = memoryStorage({
      ...legacy,
      "finpath.profile:u1": '{"monthlyIncome":99}',
    });
    expect(migrateLegacyKeys(s, "u1")).toEqual(["finpath.plan", "finpath.review"]);
    expect(s.getItem("finpath.profile:u1")).toBe('{"monthlyIncome":99}');
    expect(s.getItem("finpath.profile")).toBeNull();
  });

  it("does nothing when there is no legacy data", () => {
    const s = memoryStorage({ "finpath.profile:u1": "{}" });
    expect(migrateLegacyKeys(s, "u1")).toEqual([]);
    expect(s.dump()).toEqual({ "finpath.profile:u1": "{}" });
  });

  it("leaves unrelated keys alone (accounts, session)", () => {
    const s = memoryStorage({ ...legacy, "finpath.accounts": "[]", "finpath.session": "{}" });
    migrateLegacyKeys(s, "u1");
    expect(s.getItem("finpath.accounts")).toBe("[]");
    expect(s.getItem("finpath.session")).toBe("{}");
  });
});

describe("createScopedStore — per-account isolation", () => {
  const g = globalThis as unknown as { localStorage?: unknown; window?: unknown };
  let saved: { localStorage?: unknown; window?: unknown };

  beforeEach(() => {
    saved = { localStorage: g.localStorage, window: g.window };
    g.localStorage = memoryStorage();
    g.window = { addEventListener() {}, removeEventListener() {} };
  });
  afterEach(() => {
    g.localStorage = saved.localStorage;
    g.window = saved.window;
  });

  it("keeps two accounts' values apart", () => {
    const store = createScopedStore("finpath.profile", { income: 0 });
    store.setFor("u1", { income: 15000 });
    store.setFor("u2", { income: 60000 });
    expect(store.getFor("u1")).toEqual({ income: 15000 });
    expect(store.getFor("u2")).toEqual({ income: 60000 });
  });

  it("a new account reads the fallback, not another account's data", () => {
    const store = createScopedStore("finpath.profile", { income: 0 });
    store.setFor("u1", { income: 15000 });
    expect(store.getFor("u3")).toEqual({ income: 0 });
  });

  it("signed out reads the fallback and cannot write", () => {
    const store = createScopedStore("finpath.plan", {} as Record<string, boolean>);
    store.setFor(null, { x: true });
    expect(store.getFor(null)).toEqual({});
    expect((g.localStorage as ReturnType<typeof memoryStorage>).dump()).toEqual({});
  });

  it("returns a stable reference while storage is unchanged", () => {
    const store = createScopedStore("finpath.profile", { income: 0 });
    store.setFor("u1", { income: 1 });
    expect(store.getFor("u1")).toBe(store.getFor("u1"));
  });

  it("reads data a migration wrote", () => {
    const ls = g.localStorage as ReturnType<typeof memoryStorage>;
    ls.setItem("finpath.profile", '{"income":15000}');
    migrateLegacyKeys(ls, "u1");
    const store = createScopedStore("finpath.profile", { income: 0 });
    expect(store.getFor("u1")).toEqual({ income: 15000 });
  });
});

describe("safeNext — ?next= is never an open redirect", () => {
  it("accepts an in-app path, with query and hash", () => {
    expect(safeNext("/plan")).toBe("/plan");
    expect(safeNext("/ask?q=sip#top")).toBe("/ask?q=sip#top");
  });

  it("rejects other origins and protocol tricks", () => {
    for (const bad of [
      "//evil.example",
      "/\\evil.example",
      "https://evil.example",
      "javascript:alert(1)",
      "evil.example",
      "/plan\n//evil",
    ]) {
      expect(safeNext(bad), bad).toBeNull();
    }
  });

  it("rejects the auth and onboarding pages (they would loop)", () => {
    for (const loop of ["/login", "/signup?next=/x", "/onboarding", "/forgot-password"]) {
      expect(safeNext(loop), loop).toBeNull();
    }
  });

  it("empty is null", () => {
    expect(safeNext(null)).toBeNull();
    expect(safeNext("")).toBeNull();
  });
});
