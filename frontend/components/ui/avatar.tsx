import { cn } from "@/lib/utils";

/**
 * Avatar — THE ONLY ROUNDED ELEMENT IN THE PRODUCT (§12).
 *
 * It uses the `avatar` utility from globals.css rather than `rounded-full`,
 * for two reasons: every `--radius-*` token is pinned to 0, so the Tailwind
 * class would be inert; and the exception should be one named thing that
 * design-lint can point at rather than a class anyone might reach for.
 *
 * Initials, not a photo. FinPath has no avatar upload and inventing one
 * would be another surface holding personal data for no purpose.
 */

export function Avatar({
  name,
  size = "md",
  className,
}: {
  /** The user's display name. Initials are derived from it. */
  name: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      // The name is already rendered next to this everywhere it is used, so
      // the glyph itself is decorative and must not be announced twice.
      aria-hidden="true"
      className={cn(
        "avatar inline-flex shrink-0 items-center justify-center border border-line-strong bg-surface text-ink",
        size === "sm" ? "size-6 text-sm" : "size-8 text-base",
        "type-label",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
