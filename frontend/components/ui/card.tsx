import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card (§17).
 *
 * Used sparingly and on purpose. The default separator in FinPath is a rule
 * and vertical space — a card is for something that genuinely IS an object:
 * a source document, a simulator panel, one scenario. Wrapping every section
 * in a bordered box is what makes an interface read as a generic dashboard,
 * and §49 asks specifically whether there are unnecessary cards.
 *
 * Three grounds, no shadow, no radius:
 *   outlined  border only, transparent — recedes into the page
 *   filled    surface ground — groups without shouting
 *   sunken    for a well or a read-only block inside another surface
 */

type CardVariant = "outlined" | "filled" | "sunken";

const VARIANTS: Record<CardVariant, string> = {
  outlined: "border border-line bg-transparent",
  filled: "border border-line bg-surface",
  sunken: "bg-surface-sunken",
};

export function Card({
  variant = "outlined",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { variant?: CardVariant }) {
  return (
    <div className={cn(VARIANTS[variant], className)} {...props}>
      {children}
    </div>
  );
}

/**
 * The card's own heading band. The rule under it is structural (it bounds
 * the header region), which is the one case where a rule is not carrying an
 * amount — hence `border-line`, the decorative weight.
 */
export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="type-subhead text-ink">{title}</h3>
        {description ? (
          <p className="type-label mt-1 text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-4 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("border-t border-line px-4 py-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}
