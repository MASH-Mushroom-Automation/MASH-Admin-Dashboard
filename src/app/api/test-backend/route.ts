// Test endpoint to verify backend connectivity
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!backendUrl) {
    return NextResponse.json(
      {
        success: false,
        error: "NEXT_PUBLIC_API_URL not configured",
        configured: false,
      },
      { status: 500 }
    );
  }

  try {
    // Test backend health/connectivity
    const testUrl = `${backendUrl}/api/v1/auth/login`;
    const response = await fetch(testUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "test" }),
    });

    const status = response.status;
    const isReachable = status === 400 || status === 401 || status === 200; // Any response means backend is up

    return NextResponse.json({
      success: true,
      configured: true,
      backendUrl,
      backendReachable: isReachable,
      backendStatus: status,
      message: isReachable
        ? "Backend is reachable! Login endpoint responding."
        : "Backend returned unexpected status",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        configured: true,
        backendUrl,
        backendReachable: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Cannot reach backend - check URL and network",
      },
      { status: 500 }
    );
  }
}
