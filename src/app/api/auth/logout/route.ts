// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout
 *
 * Clears refresh token cookie and logs out user
 * Client-side code clears in-memory access token via tokenManager
 */
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });

  const isProd = process.env.NODE_ENV === "production";

  // Clear auth token cookie
  response.cookies.set({
    name: "authToken",
    value: "",
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
  });

  // Clear refresh token cookie
  response.cookies.set({
    name: "refreshToken",
    value: "",
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
  });

  return response;
}
