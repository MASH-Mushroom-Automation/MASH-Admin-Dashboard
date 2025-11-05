// lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "/api/proxy", // PROXY PATH
  withCredentials: true,
});

// Debug log (will show "none" for HttpOnly — that's correct!)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const cookie = document.cookie;
      const hasToken = cookie.includes("authToken=");
      console.log(
        "api ->",
        config.method?.toUpperCase(),
        config.url,
        "authToken cookie visible:",
        hasToken ? "YES (not HttpOnly!)" : "none (correct – HttpOnly)"
      );
    } catch (e) {
      console.log("api ->", config.method, config.url, "(cookie check failed)");
    }
  }
  return config;
});
