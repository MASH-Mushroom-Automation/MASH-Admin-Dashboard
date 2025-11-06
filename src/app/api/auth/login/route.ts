// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Hardcoded admin credentials check (takes priority)
    const ADMIN_EMAIL = "mash.mushroom.automation@gmail.com";
    const ADMIN_PASSWORD = "PP@Namias99";

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Create mock admin user
      const adminUser = {
        id: "admin-001",
        email: ADMIN_EMAIL,
        name: "Admin User",
        role: "admin",
      };

      // Create mock tokens
      const mockAccessToken = `admin-access-${Date.now()}`;
      const mockRefreshToken = `admin-refresh-${Date.now()}`;

      // Set HttpOnly cookies
      const response = NextResponse.json({
        success: true,
        user: adminUser,
      });

      const isProd = process.env.NODE_ENV === "production";
      const cookieOpts = (name: string, value: string, days: number) => ({
        name,
        value,
        httpOnly: true,
        path: "/",
        maxAge: days * 24 * 60 * 60,
        sameSite: "lax" as const,
        secure: isProd,
      });

      response.cookies.set(cookieOpts("authToken", mockAccessToken, 1)); // 1 day
      response.cookies.set(cookieOpts("refreshToken", mockRefreshToken, 30)); // 30 days

      return response;
    }

    // If not hardcoded admin, try backend API
    const backendRes = await axios.post(`${BACKEND_URL}/api/v1/auth/login`, {
      email,
      password,
      rememberMe,
    });

    // Backend returns: { success, message, accessToken, refreshToken, user }
    const { accessToken, refreshToken, user } = backendRes.data;

    // Set HttpOnly cookies
    const response = NextResponse.json({
      success: true,
      user,
    });

    const isProd = process.env.NODE_ENV === "production";
    const cookieOpts = (name: string, value: string, days: number) => ({
      name,
      value,
      httpOnly: true,
      path: "/",
      maxAge: days * 24 * 60 * 60,
      sameSite: "lax" as const,
      secure: isProd,
    });

    response.cookies.set(cookieOpts("authToken", accessToken, 1)); // 1 day
    response.cookies.set(cookieOpts("refreshToken", refreshToken, 30)); // 30 days

    return response;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
    console.error(
      "[login proxy] error:",
      axiosError.response?.data || axiosError.message
    );
    const message = axiosError.response?.data?.message || "Login failed";
    return NextResponse.json(
      { success: false, message },
      { status: axiosError.response?.status || 500 }
    );
  }
}
