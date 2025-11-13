// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Login endpoint - Authenticates user with production backend API
 * Returns access token in response body + refresh token in HttpOnly cookie
 * Access token stored in memory by client, refresh token stored in secure cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log(`[login] Attempting authentication for: ${email}`);

    // Call backend API directly (no hardcoded credentials)
    const backendRes = await axios.post(
      `${BACKEND_URL}/api/v1/auth/login`,
      { email, password },
      { timeout: 10000 } // 10 second timeout
    );

    // Backend returns nested structure: { success, data: { accessToken, refreshToken, user } }
    const backendData = backendRes.data?.data || backendRes.data;
    const { accessToken, refreshToken, user } = backendData;

    if (!accessToken || !refreshToken || !user) {
      console.error("[login] Invalid backend response structure:", backendRes.data);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid response from authentication server",
        },
        { status: 500 }
      );
    }

    console.log(`[login] Authentication successful for user: ${user.id}`);

    // Return access token in response body (stored in memory by client)
    // Return user data for immediate use
    const response = NextResponse.json({
      success: true,
      user,
      accessToken,      // ← Client stores in memory via tokenManager
      expiresIn: 3600   // ← 1 hour (matches backend token expiry)
    });

    // Set ONLY refresh token in HttpOnly cookie (secure storage)
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set({
      name: "refreshToken",
      value: refreshToken,
      httpOnly: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days (matches backend refresh token expiry)
      sameSite: "lax",
      secure: isProd,
    });

    console.log(`[login] Cookies set successfully`);

    return response;
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { 
        data?: { 
          message?: string; 
          statusCode?: number;
          action?: string;
          error?: { message?: string };
        }; 
        status?: number;
        headers?: { 'retry-after'?: string };
      };
      message?: string;
      code?: string;
    };

    // Enhanced error handling with specific scenarios
    const statusCode = axiosError.response?.status || 500;
    const backendData = axiosError.response?.data;
    const errorMessage = 
      backendData?.error?.message || 
      backendData?.message || 
      axiosError.message || 
      "Login failed";

    console.error(`[login] Authentication failed (${statusCode}):`, {
      message: errorMessage,
      code: axiosError.code,
      backend: backendData
    });

    // Map backend errors to user-friendly responses
    let response: { 
      success: false; 
      message: string; 
      action?: string; 
      retryAfter?: number 
    };

    switch (statusCode) {
      case 401:
        if (errorMessage.toLowerCase().includes("not verified") || errorMessage.toLowerCase().includes("verify")) {
          response = {
            success: false,
            message: "Please verify your email before logging in. Check your inbox for the verification link.",
            action: "resend-verification",
          };
        } else if (errorMessage.toLowerCase().includes("inactive")) {
          response = {
            success: false,
            message: "Your account has been deactivated. Please contact support for assistance.",
            action: "contact-support",
          };
        } else {
          response = {
            success: false,
            message: "Invalid email or password. Please check your credentials and try again.",
          };
        }
        break;

      case 429:
        const retryAfter = axiosError.response?.headers?.['retry-after'];
        response = {
          success: false,
          message: `Too many login attempts. Please try again in ${retryAfter || 60} seconds.`,
          retryAfter: retryAfter ? parseInt(retryAfter) : 60,
        };
        break;

      case 400:
        response = {
          success: false,
          message: errorMessage || "Invalid login request. Please check your credentials.",
        };
        break;

      case 500:
      case 502:
      case 503:
        response = {
          success: false,
          message: "Unable to connect to authentication server. Please try again later.",
        };
        break;

      default:
        response = {
          success: false,
          message: errorMessage || "An unexpected error occurred. Please try again.",
        };
    }

    return NextResponse.json(response, { status: statusCode });
  }
}
