// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight endpoint to verify if authToken cookie exists.
 * Used by the login form to check if the user is truly authenticated
 * before redirecting to dashboard (prevents auth loops).
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No auth token found" },
        { status: 401 }
      );
    }

    // Token exists - user is authenticated
    // (Add JWT verification here if needed for stronger validation)
    return NextResponse.json(
      { success: true, message: "Authenticated" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[verify] error:", error);
    return NextResponse.json(
      { success: false, message: "Verification failed" },
      { status: 500 }
    );
  }
}
