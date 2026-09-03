import {
  Compass,
  LineChart,
  ListChecks,
  MessageCircleQuestion,
  Wallet,
} from "lucide-react";
import type { NavItem } from "@/components/ui";

/**
 * The primary navigation, defined once.
 *
 * FIVE ITEMS, and that is the ceiling rather than a coincidence: five is
 * what fits across a 375px bottom bar with a 44px target each, so the
 * desktop header and the phone bar can show the SAME set. A product whose
 * navigation changes shape between devices teaches two mental models.
 *
 * The labels are the ones a student would use. Not "Nudge Simulator", not
 * "AI Counselor", not "Spending Engine" (§2, §25) — the internal name of a
 * subsystem is never a navigation label.
 */
export const NAV: readonly NavItem[] = [
  { href: "/home", label: "Home", icon: Compass },
  { href: "/spending", label: "Spending", icon: Wallet },
  { href: "/plan", label: "Plan", icon: ListChecks },
  { href: "/what-if", label: "What-if", icon: LineChart },
  { href: "/ask", label: "Ask", icon: MessageCircleQuestion },
];
