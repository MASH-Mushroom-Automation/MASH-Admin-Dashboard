// src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params; // ← AWAIT
  const path = params.path.join("/");
  const search = req.nextUrl.search;
  const url = `${BACKEND_URL}/api/${path}${search}`;

  console.log(`[PROXY] ${req.method} → ${url}`);

  const cookie = req.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/authToken=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  console.log(`[PROXY] Cookie:`, cookie ? "YES" : "NO");
  console.log(`[PROXY] Token:`, token ? "YES" : "NO");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (cookie) headers["cookie"] = cookie;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const body = ["GET", "HEAD"].includes(req.method)
    ? undefined
    : await req.text();

  try {
    const res = await fetch(url, { method: req.method, headers, body });
    const data = await res.text();

    console.log(`[PROXY] Response status: ${res.status}`);

    let json: any;
    try {
      json = JSON.parse(data);
    } catch {
      json = { message: data };
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
  } catch (error: any) {
    console.error("[PROXY] Fetch error:", error.message);
    return NextResponse.json({ error: "Proxy failed" }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
