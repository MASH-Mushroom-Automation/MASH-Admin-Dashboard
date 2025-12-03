// src/lib/csrfService.ts
/**
 * CSRF Token Service - Handles CSRF token fetching and management
 *
 * The backend sets CSRF tokens in two places:
 * 1. HttpOnly cookie: XSRF-TOKEN (automatically sent with requests)
 * 2. Response body: csrfToken (must be manually included in X-XSRF-TOKEN header)
 *
 * For state-changing operations (POST, PUT, DELETE, PATCH), both must be present:
 * - Cookie: XSRF-TOKEN (automatically sent by browser)
 * - Header: X-XSRF-TOKEN (manually added to request)
 *
 * BACKEND ENDPOINTS:
 * - GET /api/v1/csrf-token - Fetch CSRF token (sets cookie + returns token)
 * - POST /api/v1/csrf-token/refresh - Rotate CSRF token (invalidates old, sets new)
 *
 * USAGE:
 * ```typescript
 * import { getCsrfToken } from '@/lib/csrfService';
 *
 * // In any store/component that needs CSRF protection
 * const csrfToken = await getCsrfToken();
 * await api.delete('v1/users/123', {
 *   headers: { 'X-XSRF-TOKEN': csrfToken }
 * });
 * ```
 *
 * INTEGRATION POINTS:
 * - userManagementStore.ts: archiveUser() - DELETE operations
 * - authStore.ts: logout() - clears cached token
 * - Add to other stores as needed for POST/PUT/DELETE operations
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * In-memory CSRF token cache
 * Stores the current token to avoid redundant fetches
 */
let cachedCsrfToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Fetch CSRF token from backend
 * The token is set in cookies and returned in response body
 *
 * @returns Promise<string | null> The CSRF token, or null if endpoint not available
 */
export async function fetchCsrfToken(): Promise<string | null> {
  // Return cached token if still valid (valid for 5 minutes)
  if (cachedCsrfToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log("[CSRF] Using cached token");
    return cachedCsrfToken;
  }

  try {
    const baseUrl = BACKEND_URL.endsWith("/")
      ? BACKEND_URL.slice(0, -1)
      : BACKEND_URL;
    const url = `${baseUrl}/api/v1/csrf-token`;

    console.log("[CSRF] Fetching token from:", url);

    const response = await fetch(url, {
      method: "GET",
      credentials: "include", // ← CRITICAL: Receive CSRF cookie from backend
    });

    // If endpoint doesn't exist (404), CSRF is not implemented yet
    if (response.status === 404) {
      console.warn(
        "[CSRF] ⚠️ Backend CSRF endpoint not implemented (404) - skipping CSRF protection"
      );
      return null;
    }

    if (!response.ok) {
      console.error("[CSRF] Failed to fetch token:", response.status);
      return null;
    }

    const data = await response.json();
    const token =
      data.csrfToken || data.token || response.headers.get("x-csrf-token");

    if (!token) {
      console.warn(
        "[CSRF] No token in response - CSRF may not be implemented yet"
      );
      return null;
    }

    // Cache the token for 5 minutes
    cachedCsrfToken = token;
    tokenExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    console.log("[CSRF] ✓ Token fetched and cached successfully");
    return token;
  } catch (error) {
    console.warn("[CSRF] Error fetching token (CSRF not implemented?):", error);
    return null;
  }
}

/**
 * Refresh CSRF token - generates a new token and invalidates the old one
 * Use this for token rotation or after security-sensitive operations
 *
 * @returns Promise<string | null> The new CSRF token, or null if endpoint not available
 */
export async function refreshCsrfToken(): Promise<string | null> {
  try {
    const baseUrl = BACKEND_URL.endsWith("/")
      ? BACKEND_URL.slice(0, -1)
      : BACKEND_URL;
    const url = `${baseUrl}/api/v1/csrf-token/refresh`;

    console.log("[CSRF] Refreshing token from:", url);

    const response = await fetch(url, {
      method: "POST",
      credentials: "include", // ← CRITICAL: Receive new CSRF cookie
      headers: {
        "Content-Type": "application/json",
      },
    });

    // If endpoint doesn't exist (404), CSRF is not implemented yet
    if (response.status === 404) {
      console.warn(
        "[CSRF] ⚠️ Backend CSRF refresh endpoint not implemented (404) - skipping"
      );
      return null;
    }

    if (!response.ok) {
      console.error("[CSRF] Failed to refresh token:", response.status);
      return null;
    }

    const data = await response.json();
    const token =
      data.csrfToken || data.token || response.headers.get("x-csrf-token");

    if (!token) {
      console.warn(
        "[CSRF] No token in refresh response - CSRF may not be implemented yet"
      );
      return null;
    }

    // Update cache with new token
    cachedCsrfToken = token;
    tokenExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    console.log("[CSRF] ✓ Token refreshed and cached successfully");
    return token;
  } catch (error) {
    console.warn(
      "[CSRF] Error refreshing token (CSRF not implemented?):",
      error
    );
    return null;
  }
}

/**
 * Clear cached CSRF token
 * Call this on logout or when token becomes invalid
 */
export function clearCsrfToken(): void {
  console.log("[CSRF] Clearing cached token");
  cachedCsrfToken = null;
  tokenExpiry = null;
}

/**
 * Get cached CSRF token without fetching
 * Returns null if no valid cached token exists
 */
export function getCachedCsrfToken(): string | null {
  if (cachedCsrfToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedCsrfToken;
  }
  return null;
}

/**
 * Helper function to get CSRF token for use in API calls
 * Automatically fetches if not cached or expired
 * Returns null if CSRF is not implemented on backend
 *
 * @returns Promise<string | null> The CSRF token, or null if not available
 */
export async function getCsrfToken(): Promise<string | null> {
  const cached = getCachedCsrfToken();
  if (cached) {
    return cached;
  }
  return fetchCsrfToken();
}
