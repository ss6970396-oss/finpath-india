/**
 * ============================================================
 * DRAFT — THE MINUTE VALUES BELOW NEED THE PRODUCT OWNER'S REVIEW
 * BEFORE MERGE. They are placeholders chosen during the editorial
 * refactor, not measurements: nothing in the product records how
 * long an action takes. Edit `estimatedMinutes` here, and only
 * here — no other file holds these numbers.
 * ============================================================
 *
 * Presentation metadata for the plan's actions: how long each takes, and
 * what the card's button does. It is deliberately NOT in lib/plan.ts —
 * that file is frozen logic, and nothing here changes what the plan
 * recommends, in what order, or when.
 *
 * `priority` is not stored anywhere. It is DERIVED from the plan's own
 * ladder by `actionPriority`: actions in the stage that needs attention
 * now are high, the stage after it medium, everything else low. So it can
 * never disagree with the order the plan already chose.
 */

import type { Plan, PlanStep } from "./plan";

export type ActionPriority = "high" | "medium" | "low";

/**
 * What the card's button does.
 *   link  the fix lives on another screen: go there
 *   tick  nothing in FinPath can do it for you; the student does it in the
 *         world and records it here
 */
export type ActionKind =
  | { kind: "link"; href: string; label: string }
  | { kind: "tick"; label: string };

export type ActionMeta = {
  /** DRAFT — see the notice at the top of this file. */
  estimatedMinutes: number;
  action: ActionKind;
};

export const ACTION_META: Record<string, ActionMeta> = {
  "debt-clear": {
    estimatedMinutes: 10,
    action: { kind: "tick", label: "I have paid it in full" },
  },
  "debt-later": {
    estimatedMinutes: 15,
    action: { kind: "tick", label: "I have closed them" },
  },
  "buffer-account": {
    estimatedMinutes: 20,
    action: { kind: "tick", label: "I have set it up" },
  },
  "buffer-fund": {
    estimatedMinutes: 5,
    action: { kind: "link", href: "/profile", label: "Update your buffer" },
  },
  "invest-sip": {
    estimatedMinutes: 20,
    action: { kind: "link", href: "/what-if", label: "See what it becomes" },
  },
  "invest-wants": {
    estimatedMinutes: 10,
    action: { kind: "link", href: "/spending", label: "Review spending" },
  },
  "wealth-stepup": {
    estimatedMinutes: 5,
    action: { kind: "link", href: "/what-if", label: "Try a yearly increase" },
  },
  "wealth-review": {
    estimatedMinutes: 30,
    action: { kind: "tick", label: "I have reviewed it" },
  },
};

/** Used for an action id this table does not know yet. */
export const FALLBACK_META: ActionMeta = {
  estimatedMinutes: 10,
  action: { kind: "link", href: "/plan", label: "Open in Actions" },
};

export function actionMetaFor(actionId: string): ActionMeta {
  return ACTION_META[actionId] ?? FALLBACK_META;
}

/**
 * Priority from the plan's own ladder. The stage marked "attention" is the
 * one live stage (lib/plan.ts guarantees exactly one, unless everything is
 * complete); its actions are high. The next unfinished stage after it is
 * medium. Completed stages, later stages, and an unknown id are low.
 */
export function actionPriority(
  steps: readonly PlanStep[],
  actionId: string,
): ActionPriority {
  const at = steps.findIndex((s) => s.status === "attention");
  const owner = steps.findIndex((s) => s.actions.some((a) => a.id === actionId));
  if (owner === -1 || at === -1) return "low";
  if (owner === at) return "high";
  const nextOpen = steps.findIndex((s, i) => i > at && s.status !== "complete");
  return owner === nextOpen ? "medium" : "low";
}

/** Convenience for a whole plan: id -> priority. */
export function priorities(plan: Plan): Record<string, ActionPriority> {
  return Object.fromEntries(
    plan.actions.map((a) => [a.id, actionPriority(plan.steps, a.id)]),
  );
}
