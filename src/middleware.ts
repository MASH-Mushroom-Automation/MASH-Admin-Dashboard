import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy middleware to protect dashboard routes
 * Checks for refresh token in HttpOnly cookie (not access token)
 * Access tokens are stored in memory only (not accessible to middleware)
 * 
 * NOTE: This file replaces the deprecated root-level middleware.ts
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only protect /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    // Check for refresh token (long-lived, HttpOnly)
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      console.log(
        `[proxy] ❌ No refresh token found, redirecting to /login`
      );
      return NextResponse.redirect(new URL("/login", request.url));
    }

    console.log(`[proxy] ✅ Refresh token present, allowing access`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"], // Run only for /dashboard and its subroutes
};
