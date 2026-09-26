"use client";

import { ActionCard, type ActionCardPriority } from "@/components/ui";
import { actionMetaFor } from "@/lib/action-meta";
import type { PlanAction } from "@/lib/plan";
import { useFinPath } from "../providers/FinPathProvider";

/**
 * A plan action as an ActionCard — the one adapter Home and Actions both
 * use, so a card cannot say one thing on Home and another on Actions.
 *
 * What the button does comes from lib/action-meta.ts:
 *   link  go where the fix lives; "Mark as done" is offered beside it
 *   tick  the student does it in the world; the button records it
 * Either way the tick is the student's own record, persisted exactly as
 * the old checkboxes were (`toggleTask`), and it never changes a computed
 * figure.
 */
export function PlanActionCard({
  action,
  priority,
  primary = false,
  n,
}: {
  action: PlanAction;
  priority: ActionCardPriority;
  primary?: boolean;
  n?: number;
}) {
  const { done, toggleTask } = useFinPath();
  const meta = actionMetaFor(action.id);
  const isDone = Boolean(done[action.id]);
  const toggle = () => toggleTask(action.id);

  return (
    <ActionCard
      n={n}
      title={action.title}
      explanation={action.why}
      priority={priority}
      estimatedMinutes={meta.estimatedMinutes}
      primary={primary}
      done={isDone}
      note={
        action.selfAttested
          ? "Nothing in your figures can confirm this one — ticking it is your own record."
          : undefined
      }
      action={
        meta.action.kind === "link"
          ? { label: meta.action.label, href: meta.action.href }
          : { label: meta.action.label, onClick: toggle }
      }
      onMarkDone={meta.action.kind === "link" ? toggle : undefined}
      onUndo={toggle}
    />
  );
}
