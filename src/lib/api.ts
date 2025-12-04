// src/lib/api.ts
import axios from "axios";
import { getAccessToken, clearAccessToken } from "./tokenManager";

export const api = axios.create({
  baseURL: "/api/proxy",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add access token from memory
api.interceptors.request.use(
  (config) => {
    // Add access token if available
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        "[API Request] Token present, adding to Authorization header"
      );
    } else {
      console.warn(
        "[API Request] ⚠️ NO ACCESS TOKEN FOUND - Request will likely fail with 401"
      );
    }

    // Debug log in development
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      try {
        const cookie = document.cookie;
        const hasRefreshToken = cookie.includes("refreshToken=");
        console.log(
          "[API Request] ->",
          config.method?.toUpperCase(),
          config.url,
          "| Access token:",
          token ? "✓ present" : "✗ missing",
          "| Refresh token cookie:",
          hasRefreshToken ? "✓ present" : "✗ missing"
        );

        // Additional authentication check
        if (!token && !hasRefreshToken) {
          console.error(
            "[API] ❌ AUTHENTICATION FAILURE - No tokens found. User must log in first!"
          );
          console.log(
            "[API] 💡 Tip: Check if login was successful and tokens were stored"
          );
        }
      } catch {
        console.log(
          "[API Request] ->",
          config.method,
          config.url,
          "(cookie check failed)"
        );
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("[API] Token expired, attempting refresh...");

        // Call refresh endpoint (uses HttpOnly refresh cookie automatically)
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include", // ← CRITICAL: Sends HttpOnly refresh cookie
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();

          // Update in-memory access token
          const { setAccessToken } = await import("./tokenManager");
          setAccessToken(
            refreshData.accessToken,
            refreshData.expiresIn || 3600
          );

          console.log("[API] Token refreshed successfully, retrying request");

          // Update Authorization header with new token
          originalRequest.headers.Authorization = `Bearer ${refreshData.accessToken}`;

          // Retry the original request with new token
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("[API] Token refresh failed:", refreshError);
      }

      // Refresh failed - clear tokens and redirect to login
      console.log("[API] Refresh failed, redirecting to login");
      clearAccessToken();

      if (typeof window !== "undefined") {
        // Clear user state from authStore
        const { useAuthStore } = await import("@/store/authStore");
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);
