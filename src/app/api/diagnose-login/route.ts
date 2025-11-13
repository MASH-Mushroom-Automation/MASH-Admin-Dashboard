import { NextResponse } from "next/server";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint to test backend connectivity and login flow
 * Navigate to: http://localhost:3001/api/diagnose-login
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    backendUrl: BACKEND_URL,
    tests: [] as Array<{
      name: string;
      status: "passed" | "failed";
      message: string;
      duration?: number;
      details?: unknown;
    }>,
  };

  // Test 1: Environment Variable
  results.tests.push({
    name: "Environment Variable Check",
    status: BACKEND_URL.includes("railway.app") ? "passed" : "failed",
    message: BACKEND_URL.includes("railway.app")
      ? `✅ Using production: ${BACKEND_URL}`
      : `⚠️ Not using Railway: ${BACKEND_URL}`,
  });

  // Test 2: Simple HTTP GET (no authentication)
  try {
    const start = Date.now();
    const response = await axios.get(BACKEND_URL, { timeout: 15000 });
    const duration = Date.now() - start;

    results.tests.push({
      name: "Backend Base URL Reachability",
      status: "passed",
      message: `✅ Backend responded in ${duration}ms`,
      duration,
      details: { status: response.status },
    });
  } catch (error) {
    const axiosError = error as { code?: string; message?: string };
    results.tests.push({
      name: "Backend Base URL Reachability",
      status: "failed",
      message: `❌ Failed: ${axiosError.message}`,
      details: { code: axiosError.code },
    });
  }

  // Test 3: Login Endpoint Connectivity (without credentials)
  try {
    const start = Date.now();
    await axios.post(
      `${BACKEND_URL}/api/v1/auth/login`,
      { email: "test@test.com", password: "test" },
      { timeout: 15000, validateStatus: () => true } // Accept all status codes
    );
    const duration = Date.now() - start;

    results.tests.push({
      name: "Login Endpoint Reachability",
      status: "passed",
      message: `✅ Login endpoint responded in ${duration}ms (validation will fail, but endpoint is reachable)`,
      duration,
    });
  } catch (error) {
    const axiosError = error as {
      code?: string;
      message?: string;
      response?: { status?: number };
    };
    results.tests.push({
      name: "Login Endpoint Reachability",
      status: "failed",
      message: `❌ Failed: ${axiosError.message}`,
      details: {
        code: axiosError.code,
        status: axiosError.response?.status,
      },
    });
  }

  // Test 4: Actual Login Attempt
  try {
    const start = Date.now();
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/auth/login`,
      {
        email: "mash.mushroom.automation@gmail.com",
        password: "PP@Namias99",
      },
      { timeout: 30000 }
    );
    const duration = Date.now() - start;

    const data = response.data?.data || response.data;

    results.tests.push({
      name: "Production Login Test",
      status: data.accessToken ? "passed" : "failed",
      message: data.accessToken
        ? `✅ Login successful in ${duration}ms`
        : `⚠️ No access token received`,
      duration,
      details: {
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken,
        hasUser: !!data.user,
        userId: data.user?.id,
        userEmail: data.user?.email,
      },
    });
  } catch (error) {
    const axiosError = error as {
      code?: string;
      message?: string;
      response?: { status?: number; data?: unknown };
    };

    results.tests.push({
      name: "Production Login Test",
      status: "failed",
      message: `❌ Login failed: ${axiosError.message}`,
      details: {
        code: axiosError.code,
        status: axiosError.response?.status,
        responseData: axiosError.response?.data,
      },
    });
  }

  // Overall Status
  const allPassed = results.tests.every((t) => t.status === "passed");
  const criticalFailed =
    results.tests.filter(
      (t) =>
        t.status === "failed" &&
        (t.name.includes("Reachability") || t.name.includes("Login Test"))
    ).length > 0;

  return NextResponse.json(
    {
      ...results,
      summary: {
        total: results.tests.length,
        passed: results.tests.filter((t) => t.status === "passed").length,
        failed: results.tests.filter((t) => t.status === "failed").length,
        overallStatus: allPassed
          ? "✅ ALL TESTS PASSED"
          : criticalFailed
          ? "🔴 CRITICAL FAILURES"
          : "⚠️ SOME TESTS FAILED",
        recommendation: allPassed
          ? "Backend is healthy. Login should work correctly."
          : criticalFailed
          ? "Backend is unreachable. Check Railway service status and network connectivity."
          : "Minor issues detected. Review test details.",
        nextSteps: allPassed
          ? [
              "Navigate to http://localhost:3001/login",
              "Login with: mash.mushroom.automation@gmail.com / PP@Namias99",
              "You should be redirected to /dashboard",
            ]
          : [
              "Check Railway service status: https://railway.app/dashboard",
              "Verify network connectivity",
              "Check firewall settings (corporate networks may block Railway)",
              "Try from a different network (mobile hotspot)",
              "Contact backend team if issue persists",
            ],
      },
    },
    {
      status: allPassed ? 200 : 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}
