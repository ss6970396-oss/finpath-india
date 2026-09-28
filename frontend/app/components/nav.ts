import {
  House,
  ListChecks,
  MessageCircleQuestion,
  UserRound,
} from "lucide-react";
import type { NavItem } from "@/components/ui";

/**
 * The primary navigation, defined once.
 *
 * FOUR ITEMS: Home · Actions · Ask · Profile. Every screen in the product
 * answers "what should I do next?", and these are the four places that
 * answer can live: where you stand (Home), what to do about it (Actions),
 * a question you have (Ask), and the figures everything is built from
 * (Profile).
 *
 * The desktop header and the phone bottom bar render the SAME list. A
 * navigation that changes shape between devices teaches two mental models,
 * and four fits a 375px bar with room to spare at 44px a target.
 *
 * Spending and What-if are NOT in it. They are places you go to study
 * something, reached from the action that sent you there and from the
 * secondary links on Home and Actions — not destinations anyone needs one
 * tap away from every screen. `also` keeps the parent item marked while
 * you are on one of them, so the bar still says where you are.
 *
 * The labels are the ones a student would use, and verbs where a verb
 * fits ("Ask", not "AI"). Not "Nudge Simulator", not "AI Counselor", not
 * "Roadmap" (§2, §25): the internal name of a subsystem is never a
 * navigation label. /plan keeps its URL; only its label is "Actions".
 */
export const NAV: readonly NavItem[] = [
  { href: "/home", label: "Home", icon: House, also: ["/spending", "/what-if"] },
  { href: "/plan", label: "Actions", icon: ListChecks },
  { href: "/ask", label: "Ask", icon: MessageCircleQuestion },
  { href: "/profile", label: "Profile", icon: UserRound },
];

/**
 * The places that left the primary nav, offered as clearly visible
 * secondary links on Home and Actions. Defined here so both pages, and the
 * footer, name them the same way.
 */
export const SECONDARY: readonly { href: string; label: string; description: string }[] = [
  {
    href: "/spending",
    label: "Spending",
    description: "Where this month's money went, and your statement.",
  },
  {
    href: "/what-if",
    label: "What-if",
    description: "What a monthly amount becomes over time.",
  },
];

