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
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
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
        console.log("api ->", config.method, config.url, "(cookie check failed)");
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token via API route
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include", // Include HttpOnly cookies
        });

        if (refreshResponse.ok) {
          // Token manager will be updated by authStore after refresh
          await refreshResponse.json();
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("[API] Token refresh failed:", refreshError);
      }

      // Refresh failed - clear tokens and redirect to login
      clearAccessToken();
      
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);