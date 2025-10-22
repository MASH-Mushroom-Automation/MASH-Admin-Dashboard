import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect to login page when accessing root route
  redirect("/login");
}
