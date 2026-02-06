// src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

// Log the backend URL on module load to help with debugging
console.log("[PROXY] Backend URL configured as:", BACKEND_URL || "NOT SET");

export const dynamic = "force-dynamic";

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  // Check if BACKEND_URL is configured
  if (!BACKEND_URL) {
    console.error("[PROXY] NEXT_PUBLIC_API_URL is not configured in .env file");
    return NextResponse.json(
      {
        error:
          "Backend API URL not configured. Please set NEXT_PUBLIC_API_URL in .env file",
      },
      { status: 500 }
    );
  }

  const params = await context.params; // ← AWAIT
  const path = params.path.join("/");
  const search = req.nextUrl.search;

  // Remove trailing slash from BACKEND_URL to prevent double slashes
  const baseUrl = BACKEND_URL?.endsWith("/")
    ? BACKEND_URL.slice(0, -1)
    : BACKEND_URL;
  const url = `${baseUrl}/api/${path}${search}`;

  console.log(`[PROXY] ${req.method} → ${url}`);

  // Safety: avoid proxying to the same Next.js server (common accidental misconfiguration)
  try {
    const reqHost = req.nextUrl.host; // host:port of incoming request
    const backendHost = new URL(BACKEND_URL).host;
    if (reqHost === backendHost) {
      console.error(
        `[PROXY] Misconfigured BACKEND_URL: proxy target (${backendHost}) matches the Next.js host (${reqHost}). This would create a request loop.`
      );
      return NextResponse.json(
        {
          error:
            "Proxy misconfigured: set NEXT_PUBLIC_API_URL to your backend URL",
        },
        { status: 502 }
      );
    }
  } catch {
    // If URL parsing fails, continue and let fetch handle errors.
  }

  // Priority 1: Check if client already sent Authorization header (direct backend auth)
  let token: string | null = null;
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7); // Remove "Bearer " prefix
    console.log(`[PROXY] Token from Authorization header: YES`);
  } else {
    // Priority 2: Fallback to cookie-based token (backward compatibility)
    const cookie = req.headers.get("cookie") || "";
    const tokenMatch = cookie.match(/authToken=([^;]+)/);
    token = tokenMatch ? tokenMatch[1] : null;
    console.log(`[PROXY] Cookie:`, cookie ? "YES" : "NO");
    console.log(`[PROXY] Token from cookie:`, token ? "YES" : "NO");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Always forward the token as Bearer token to backend
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log(`[PROXY] Forwarding Bearer token to backend`);
  } else {
    console.warn(
      `[PROXY] ⚠️ No token found - request will likely fail with 401`
    );
  }

  // Forward CSRF token if present (required by backend for POST/PUT/DELETE/PATCH)
  // Backend expects x-csrf-token header (lowercase, NestJS CSRF guard standard)
  // Check both common header variants
  const csrfToken =
    req.headers.get("x-csrf-token") || req.headers.get("X-CSRF-Token") || req.headers.get("x-xsrf-token");
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
    console.log(
      `[PROXY] ✓ Forwarding CSRF token to backend:`,
      csrfToken.substring(0, 20) + "..."
    );
  } else {
    // Only warn for state-changing methods where CSRF is typically required
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (!safeMethods.includes(req.method.toUpperCase())) {
      // Debug: Log all headers to see what's being sent
      console.warn(
        `[PROXY] ⚠️ No CSRF token in request headers - backend may reject`
      );
      if (process.env.NODE_ENV === "development") {
        console.log("[PROXY] Available headers:", Array.from(req.headers.keys()));
      }
    }
  }

  // Forward all cookies to backend (may contain CSRF cookie)
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
    const cookieNames = cookieHeader.split(';').map(c => c.trim().split('=')[0]);
    console.log(`[PROXY] Forwarding cookies to backend: ${cookieNames.join(', ')}`);
  }

  const body = ["GET", "HEAD"].includes(req.method)
    ? undefined
    : await req.text();

  try {
    const res = await fetch(url, { method: req.method, headers, body });
    const data = await res.text();

    console.log(`[PROXY] Response status: ${res.status}`);

    let json: Record<string, unknown>;
    try {
      json = JSON.parse(data) as Record<string, unknown>;
    } catch {
      json = { message: data };
    }

    // Log error responses for debugging
    if (res.status >= 400) {
      console.error(
        `[PROXY] Error response from backend:`,
        JSON.stringify(json, null, 2)
      );
    }

    const response = NextResponse.json(json, { status: res.status });

    // Forward ALL Set-Cookie headers from backend to client
    // The backend may set multiple cookies (e.g., XSRF-TOKEN and _csrf_secret)
    let setCookieHeaders: string[] = [];
    
    // Try to use getSetCookie() if available (Node 19.7+)
    if (typeof res.headers.getSetCookie === 'function') {
      setCookieHeaders = res.headers.getSetCookie();
    } else {
      // Fallback for older Node versions - get all set-cookie headers manually
      const setCookieHeader = res.headers.get("set-cookie");
      if (setCookieHeader) {
        // Multiple Set-Cookie headers may be concatenated with newlines
        setCookieHeaders = setCookieHeader.split(/\n/).filter(Boolean);
      }
    }
    
    if (setCookieHeaders.length > 0) {
      console.log(`[PROXY] Forwarding ${setCookieHeaders.length} cookie(s) from backend`);
      
      for (const setCookie of setCookieHeaders) {
        const [nameValue, ...attributes] = setCookie.trim().split(";");
        const [name, value] = nameValue.split("=");
        
        if (name && value) {
          // Parse cookie attributes
          const cookieOptions: Record<string, unknown> = { path: "/" };
          
          for (const attr of attributes) {
            const [attrName, attrValue] = attr.trim().split("=");
            const lowerAttrName = attrName?.toLowerCase();
            
            if (lowerAttrName === "httponly") {
              cookieOptions.httpOnly = true;
            } else if (lowerAttrName === "secure") {
              // In development, respect the flag but allow it to be disabled if needed
              // Usually backend sets Secure=true in prod. In dev (localhost), browsers allow Secure cookies.
              // But if accessing via IP (http://192.168...), Secure cookies fail.
              // We'll keep it simple: Trust the backend, but if in dev, maybe we should relax it?
              // Let's stick to mirroring the backend for now, but log it.
              cookieOptions.secure = true;
            } else if (lowerAttrName === "samesite") {
              cookieOptions.sameSite = attrValue?.toLowerCase() as "strict" | "lax" | "none";
            } else if (lowerAttrName === "max-age") {
              cookieOptions.maxAge = parseInt(attrValue || "0", 10);
            } else if (lowerAttrName === "path") {
              cookieOptions.path = attrValue || "/";
            }
          }
          
          response.cookies.set(name.trim(), value.trim(), cookieOptions);
          console.log(`[PROXY] ✓ Cookie: ${name.trim()} (httpOnly: ${cookieOptions.httpOnly || false})`);
        }
      }
    }

    return response;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[PROXY] Fetch error:", err.message);
    return NextResponse.json({ error: "Proxy failed" }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
