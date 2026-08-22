import { redirect } from "next/navigation";

/** The sidebar's "Clients" label points to /dashboard/customers — this
 * redirect just protects anyone who guesses the URL from the French label
 * instead of clicking the link. */
export default function ClientsRedirectPage() {
  redirect("/dashboard/customers");
}
