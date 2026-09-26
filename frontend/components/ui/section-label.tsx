import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SectionLabel — the newspaper section header: small, uppercase,
 * letter-spaced, muted Inter (`type-eyebrow`). It names what KIND of thing
 * follows ("Money health score", "Also in FinPath") and is usually the
 * section's heading element, so a screen reader can jump between sections.
 *
 * `as` picks the element: h2 by default; p when the real heading is
 * something else nearby.
 */
export function SectionLabel({
  as: Tag = "h2",
  id,
  className,
  children,
}: {
  as?: "h2" | "h3" | "p";
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag id={id} className={cn("type-eyebrow text-ink-muted", className)}>
      {children}
    </Tag>
  );
}
