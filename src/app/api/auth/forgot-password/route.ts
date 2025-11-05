// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Forward to backend forgot-password endpoint
    const backendRes = await axios.post(
      `${BACKEND_URL}/api/v1/auth/forgot-password`,
      { email }
    );

    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
    console.error(
      "[forgot-password proxy] error:",
      axiosError.response?.data || axiosError.message
    );
    const message = axiosError.response?.data?.message || "Request failed";
    return NextResponse.json(
      { success: false, message },
      { status: axiosError.response?.status || 500 }
    );
  }
}
