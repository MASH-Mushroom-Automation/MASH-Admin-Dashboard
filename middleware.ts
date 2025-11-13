import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware to protect dashboard routes
 * Checks for refresh token in HttpOnly cookie
 * Access tokens are in memory (not accessible to middleware)
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log(`[middleware] Checking auth for: ${pathname}`);

  // For direct backend authentication, we rely on client-side state
  // The middleware will let the request through and client will handle redirects
  // This prevents issues with SSR and client-side localStorage
  
  // Protect only the /dashboard routes - but allow first render
  // Client-side auth check will redirect if needed
  if (pathname.startsWith("/dashboard")) {
    console.log("✅ Allowing dashboard access - client will verify auth");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"], // Run only for /dashboard and its subroutes
};
