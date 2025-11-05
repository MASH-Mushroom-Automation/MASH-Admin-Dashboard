import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

/**
 * Server-side layout that protects all /dashboard routes.
 *
 * This performs a simple presence check for the `authToken` cookie
 * and redirects to /login if missing. Keep this lightweight —
 * full token validation should happen in API handlers or with a
 * JWT verification routine if you need stronger guarantees.
 */
export default async function DashboardLayout({ children }: Props) {
  // `cookies()` can be async in some Next versions/types, so await it to be safe.
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value;

  if (!token) {
    // Redirect on the server before the client bundle loads.
    // We intentionally only check presence here to avoid network calls
    // during layout render. Add local JWT verification here if available.
    redirect("/login");
  }

  return <>{children}</>;
}
