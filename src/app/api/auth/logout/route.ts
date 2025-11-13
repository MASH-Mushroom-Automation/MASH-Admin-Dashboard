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

  // Clear refresh token (only cookie we store)
  response.cookies.set({
    name: "refreshToken",
    value: "",
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return response;
}
