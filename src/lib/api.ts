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
    }

    // Debug log in development
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      try {
        const cookie = document.cookie;
        const hasToken = cookie.includes("authToken=");
        console.log(
          "api ->",
          config.method?.toUpperCase(),
          config.url,
          "| authToken cookie:",
          hasToken ? "YES (not HttpOnly!)" : "none (correct – HttpOnly)",
          "| Bearer token:",
          token ? "present" : "none"
        );
      } catch {
        console.log(
          "api ->",
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
