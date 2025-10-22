import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("running"); // 👈 appears in your terminal on each request

  // Check for auth cookie (replace 'authToken' with your cookie name)
  const token = request.cookies.get("authToken")?.value;
  const isAuthenticated = Boolean(token);

  // Protect only the /dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard") && !isAuthenticated) {
    console.log("🚫 Not authenticated — redirecting to /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"], // Run only for /dashboard and its subroutes
};
