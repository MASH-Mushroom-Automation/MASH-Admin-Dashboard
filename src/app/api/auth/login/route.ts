// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Retry login request up to 3 times with exponential backoff
 * Handles Railway cold start delays (503 errors) and network issues
 */
async function loginWithRetry(
  url: string,
  body: { email: string; password: string },
  csrfToken: string | null = null,
  cookieHeader: string | null = null,
  maxRetries = 3
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[login] Attempt ${attempt}/${maxRetries} - calling ${url}`);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      // Add CSRF token if present
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }

      // Add cookies if present (includes CSRF cookie)
      if (cookieHeader) {
        headers["Cookie"] = cookieHeader;
      }

      const response = await axios.post(url, body, {
        timeout: 30000, // 30 seconds (handles cold starts)
        headers,
        withCredentials: true, // Send cookies for CSRF protection
      });

      console.log(`[login] Attempt ${attempt} succeeded`);
      return response;
    } catch (error) {
      lastError = error;
      const axiosError = error as {
        response?: { status?: number };
        code?: string;
      };

      // Retry on connection errors or 503 (service unavailable)
      const shouldRetry =
        axiosError.code === "ECONNREFUSED" ||
        axiosError.code === "ETIMEDOUT" ||
        axiosError.code === "ENOTFOUND" ||
        axiosError.code === "ECONNRESET" ||
        axiosError.response?.status === 503;

      if (shouldRetry && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(
          `[login] Attempt ${attempt} failed (${
            axiosError.code || axiosError.response?.status
          }), retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Don't retry on authentication errors (401, 400)
      console.log(
        `[login] Attempt ${attempt} failed, not retrying (status: ${axiosError.response?.status}, code: ${axiosError.code})`
      );
      throw error;
    }
  }

  throw lastError;
}

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
    console.log(`[login] Backend URL: ${BACKEND_URL}`);

    // Get CSRF token from request header
    const csrfToken = request.headers.get("x-csrf-token");
    console.log(`[login] CSRF token present:`, csrfToken ? "YES" : "NO");

    // Get cookies from request (includes CSRF cookie)
    const cookieHeader = request.headers.get("cookie");

    // Remove trailing slash from BACKEND_URL
    const baseUrl = BACKEND_URL.endsWith("/")
      ? BACKEND_URL.slice(0, -1)
      : BACKEND_URL;

    // Call backend API with retry logic (handles cold starts and network issues)
    const backendRes = await loginWithRetry(
      `${baseUrl}/api/v1/auth/login`,
      { email, password },
      csrfToken,
      cookieHeader
    );

    // Backend returns nested structure: { success, data: { accessToken, refreshToken, user } }
    const backendData = backendRes.data?.data || backendRes.data;
    const { accessToken, refreshToken, user } = backendData;

    // Log user details (including role for debugging RBAC issues)
    console.log('[login] User data from backend:', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      isActive: user?.isActive,
    });

    if (!accessToken || !refreshToken || !user) {
      console.error(
        "[login] Invalid backend response structure:",
        backendRes.data
      );
      return NextResponse.json(
        {
          success: false,
          message: "Invalid response from authentication server",
        },
        { status: 500 }
      );
    }

    // ⚠️ CRITICAL: Verify user has SUPER_ADMIN role for admin dashboard access
    if (user.role !== 'SUPER_ADMIN') {
      console.warn(`[login] Access denied for user ${user.id} with role: ${user.role}`);
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. This dashboard is only available to Super Administrators.",
          action: "insufficient-permissions",
        },
        { status: 403 }
      );
    }

    console.log(`[login] Authentication successful for SUPER_ADMIN user: ${user.id}`);

    // Return access token in response body (stored in memory by client)
    // Return user data for immediate use
    const response = NextResponse.json({
      success: true,
      user,
      accessToken, // ← Client stores in memory via tokenManager
      expiresIn: 3600, // ← 1 hour (matches backend token expiry)
    });

    const isProd = process.env.NODE_ENV === "production";

    // Set access token in HttpOnly cookie for proxy to use
    response.cookies.set({
      name: "authToken",
      value: accessToken,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60, // 1 hour (matches access token expiry)
      sameSite: "lax",
      secure: isProd,
    });

    // Set ONLY refresh token in HttpOnly cookie (secure storage)
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
        headers?: { "retry-after"?: string };
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
      url: `${BACKEND_URL}/api/v1/auth/login`,
      message: errorMessage,
      code: axiosError.code,
      backend: backendData,
      timestamp: new Date().toISOString(),
    });

    // Map backend errors to user-friendly responses
    let response: {
      success: false;
      message: string;
      action?: string;
      retryAfter?: number;
    };

    switch (statusCode) {
      case 401:
        if (
          errorMessage.toLowerCase().includes("not verified") ||
          errorMessage.toLowerCase().includes("verify")
        ) {
          response = {
            success: false,
            message:
              "Please verify your email before logging in. Check your inbox for the verification link.",
            action: "resend-verification",
          };
        } else if (errorMessage.toLowerCase().includes("inactive")) {
          response = {
            success: false,
            message:
              "Your account has been deactivated. Please contact support for assistance.",
            action: "contact-support",
          };
        } else {
          response = {
            success: false,
            message:
              "Invalid email or password. Please check your credentials and try again.",
          };
        }
        break;

      case 429:
        const retryAfter = axiosError.response?.headers?.["retry-after"];
        response = {
          success: false,
          message: `Too many login attempts. Please try again in ${
            retryAfter || 60
          } seconds.`,
          retryAfter: retryAfter ? parseInt(retryAfter) : 60,
        };
        break;

      case 400:
        response = {
          success: false,
          message:
            errorMessage ||
            "Invalid login request. Please check your credentials.",
        };
        break;

      case 500:
      case 502:
      case 503:
        response = {
          success: false,
          message:
            "Unable to connect to authentication server. Please try again later.",
        };
        break;

      default:
        response = {
          success: false,
          message:
            errorMessage || "An unexpected error occurred. Please try again.",
        };
    }

    return NextResponse.json(response, { status: statusCode });
  }
}
