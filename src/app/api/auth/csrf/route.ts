// src/app/api/auth/csrf/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fetch CSRF token from backend
 * This endpoint should be called before making authenticated requests
 */
export async function GET() {
  try {
    // Remove trailing slash from BACKEND_URL
    const baseUrl = BACKEND_URL.endsWith("/")
      ? BACKEND_URL.slice(0, -1)
      : BACKEND_URL;
    const url = `${baseUrl}/api/v1/auth/csrf-token`;

    console.log(`[CSRF] Fetching CSRF token from: ${url}`);

    const response = await axios.get(url, {
      timeout: 10000,
      withCredentials: true,
    });

    const csrfToken = response.data?.csrfToken || response.data?.token;

    if (!csrfToken) {
      console.error("[CSRF] No CSRF token in backend response:", response.data);
      return NextResponse.json(
        { success: false, message: "Failed to fetch CSRF token" },
        { status: 500 }
      );
    }

    console.log(`[CSRF] Token fetched successfully`);

    // Return the token and forward any cookies from backend
    const nextResponse = NextResponse.json({
      success: true,
      csrfToken,
    });

    // Forward Set-Cookie headers from backend
    const setCookieHeader = response.headers["set-cookie"];
    if (setCookieHeader) {
      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : [setCookieHeader];
      cookies.forEach((cookie: string) => {
        const [cookiePair] = cookie.split(";");
        const [name, value] = cookiePair.split("=");
        if (name && value) {
          nextResponse.cookies.set(name.trim(), value.trim(), {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        }
      });
    }

    return nextResponse;
  } catch (error: unknown) {
    const axiosError = error as {
      response?: { data?: unknown; status?: number };
      message?: string;
      code?: string;
    };

    console.error("[CSRF] Failed to fetch CSRF token:", {
      message: axiosError.message,
      code: axiosError.code,
      status: axiosError.response?.status,
      data: axiosError.response?.data,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch CSRF token from backend",
        error: axiosError.message,
      },
      { status: axiosError.response?.status || 500 }
    );
  }
}
