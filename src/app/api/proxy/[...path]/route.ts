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
  const url = `${BACKEND_URL}/api/${path}${search}`;

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
    console.warn(`[PROXY] ⚠️ No token found - request will likely fail with 401`);
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

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const [first] = setCookie.split(";");
      const eq = first.indexOf("=");
      if (eq !== -1) {
        response.cookies.set(first.slice(0, eq), first.slice(eq + 1), {
          path: "/",
          httpOnly: true,
        });
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
export const DELETE = handler;
