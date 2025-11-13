import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/refresh
 *
 * Refresh access token using refresh token from HttpOnly cookie
 *
 * This endpoint:
 * 1. Extracts refresh token from HttpOnly cookie
 * 2. Sends it to backend to get new access + refresh tokens
 * 3. Sets new refresh token in HttpOnly cookie
 * 4. Returns new access token to frontend (stored in memory by tokenManager)
 *
 * Security:
 * - Refresh token never exposed to JavaScript (XSS protection)
 * - Access token rotated on each refresh
 * - Refresh token rotated on each use (prevents replay attacks)
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "No refresh token found",
        },
        { status: 401 }
      );
    }

    // Call backend refresh endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${backendUrl}/api/v1/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      // Refresh token expired or invalid - clear cookies
      const clearCookiesResponse = NextResponse.json(
        {
          success: false,
          message: "Refresh token expired or invalid",
        },
        { status: 401 }
      );

      clearCookiesResponse.cookies.set("authToken", "", {
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      clearCookiesResponse.cookies.set("refreshToken", "", {
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return clearCookiesResponse;
    }

    const data = await response.json();
    const backendData = data.data || data;

    // Return access token in response body (frontend stores in memory)
    const successResponse = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: backendData.accessToken,
      expiresIn: backendData.expiresIn || 3600, // 1 hour
      user: backendData.user,
    });

    // ✅ ONLY set refresh token in HttpOnly cookie (secure storage)
    // ✅ Access token returned in response body (stored in memory by client)
    if (backendData.refreshToken) {
      successResponse.cookies.set("refreshToken", backendData.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      });
    }

    return successResponse;
  } catch (error) {
    console.error("[API] Token refresh error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to refresh token",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
