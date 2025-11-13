import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware to protect dashboard routes
 * Checks for refresh token in HttpOnly cookie
 * Access tokens are in memory (not accessible to middleware)
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log(`[middleware] Checking auth for: ${pathname}`);

  // Check for refresh token cookie (long-lived, 7 days)
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const isAuthenticated = Boolean(refreshToken);

  // Protect only the /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      console.log("🚫 No refresh token — redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    console.log("✅ Refresh token present — allowing access");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"], // Run only for /dashboard and its subroutes
};
