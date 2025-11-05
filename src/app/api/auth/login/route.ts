// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, remember } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendRes = await axios.post(`${BACKEND_URL}/api/v1/auth/login`, {
      email,
      password,
      remember,
    });

    const { accessToken, refreshToken, user } = backendRes.data.data;

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
  } catch (error: any) {
    console.error(
      "[login proxy] error:",
      error.response?.data || error.message
    );
    const message = error.response?.data?.message || "Login failed";
    return NextResponse.json(
      { success: false, message },
      { status: error.response?.status || 500 }
    );
  }
}
