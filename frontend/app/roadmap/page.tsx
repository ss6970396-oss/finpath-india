import { redirect } from "next/navigation";

/**
 * Legacy route. The rebuild renamed this page to /plan (your plan);
 * old bookmarks, links in earlier README screenshots and anything a student
 * saved must keep resolving, so the path stays as a permanent redirect
 * rather than a 404.
 */
export default function LegacyRoute() {
  redirect("/plan");
}
