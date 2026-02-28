// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/users/[id] - Archive/delete user with CSRF protection
 *
 * This route handles CSRF token fetching and user deletion in one go
 * to avoid CORS issues with direct backend calls from the frontend
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`[API DELETE USER] Starting delete process for user: ${id}`);

    // Extract auth token from Authorization header (in-memory token from frontend)
    const authHeader = request.headers.get("authorization");
    let authToken: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      authToken = authHeader.substring(7);
      console.log("[API DELETE USER] Token from Authorization header");
    } else {
      // Fallback to cookie (backward compatibility)
      const cookie = request.headers.get("cookie") || "";
      const authTokenMatch = cookie.match(/authToken=([^;]+)/);
      authToken = authTokenMatch ? authTokenMatch[1] : null;
      if (authToken) {
        console.log("[API DELETE USER] Token from cookie");
      }
    }

    if (!authToken) {
      console.error(
        "[API DELETE USER] No auth token found in header or cookie"
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized - no auth token" },
        { status: 401 }
      );
    }

    const cookie = request.headers.get("cookie") || "";

    const baseUrl = BACKEND_URL?.endsWith("/")
      ? BACKEND_URL.slice(0, -1)
      : BACKEND_URL;

    // Step 1: Fetch CSRF token from backend
    console.log("[API DELETE USER] Fetching CSRF token");
    const csrfResponse = await fetch(`${baseUrl}/api/v1/csrf-token`, {
      method: "GET",
      credentials: "include",
      headers: {
        Cookie: cookie,
      },
    });

    if (!csrfResponse.ok) {
      console.error(
        "[API DELETE USER] Failed to fetch CSRF token:",
        csrfResponse.status
      );
      return NextResponse.json(
        { success: false, message: "Failed to fetch CSRF token" },
        { status: 500 }
      );
    }

    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;

    if (!csrfToken) {
      console.error("[API DELETE USER] No CSRF token in response");
      return NextResponse.json(
        { success: false, message: "CSRF token not found" },
        { status: 500 }
      );
    }

    console.log(
      "[API DELETE USER] CSRF token obtained, proceeding with delete"
    );

    // Step 2: Delete user with CSRF token
    const deleteUrl = `${baseUrl}/api/v1/users/${id}`;
    console.log(`[API DELETE USER] DELETE → ${deleteUrl}`);

    const deleteResponse = await fetch(deleteUrl, {
      method: "DELETE",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "X-XSRF-TOKEN": csrfToken,
        "Content-Type": "application/json",
        Cookie: cookie,
      },
    });

    const responseData = await deleteResponse.json();

    if (!deleteResponse.ok) {
      console.error(
        "[API DELETE USER] Delete failed:",
        deleteResponse.status,
        responseData
      );
      return NextResponse.json(responseData, { status: deleteResponse.status });
    }

    console.log("[API DELETE USER] ✓ User deleted successfully");
    return NextResponse.json(responseData, { status: 200 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[API DELETE USER] Error:", err.message);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
