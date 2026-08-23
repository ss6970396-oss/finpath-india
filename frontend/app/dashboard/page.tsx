import { redirect } from "next/navigation";

/** The dashboard was renamed to the Spending Engine. Keep old links working. */
export default function DashboardRedirect() {
  redirect("/spending");
}
