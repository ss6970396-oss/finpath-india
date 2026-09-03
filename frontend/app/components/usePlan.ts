"use client";

import { useMemo } from "react";
import { biggestOpportunity, buildPlan, type PlanInput } from "@/lib/plan";
import { useFinPath } from "../providers/FinPathProvider";

/**
 * The plan, derived once and shared by /home and /plan.
 *
 * Both pages show the same ladder — /home shows the top of it as "next best
 * actions", /plan shows all of it — and they must not be able to disagree.
 * A second derivation is how a product ends up telling someone to clear a
 * card on one screen and to start investing on another.
 *
 * The two nullable fields are nullable ON PURPOSE. `emergencyFund` and
 * `debtTotal` are null when nothing has been declared, and `lib/plan.ts`
 * branches on that to decide whether a stage's progress is measured or
 * merely self-attested — a distinction it then prints on screen. Passing 0
 * for "unknown" would silently upgrade "we have no idea" into "you owe
 * nothing", which is the single most flattering lie this product could tell.
 */
export function usePlanInput(): PlanInput {
  const { profile, budget, allowance, totals, ratio, params, done } =
    useFinPath();
  const declared = Boolean(profile.completedAt);

  return useMemo(
    () => ({
      allowance,
      totals,
      ratio,
      wantsThreshold: params.wants_threshold,
      emergencyFund: declared ? profile.emergencyFund : null,
      emergencyTarget: budget.emergencyTarget,
      debtTotal: declared ? budget.debtTotal : null,
      priority: profile.priority,
      done,
    }),
    [
      allowance,
      totals,
      ratio,
      params.wants_threshold,
      declared,
      profile.emergencyFund,
      profile.priority,
      budget.emergencyTarget,
      budget.debtTotal,
      done,
    ],
  );
}

export function usePlan() {
  const input = usePlanInput();
  return useMemo(() => buildPlan(input), [input]);
}

export function useOpportunity() {
  const input = usePlanInput();
  return useMemo(() => biggestOpportunity(input), [input]);
}
