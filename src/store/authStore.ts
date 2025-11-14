// src/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logger } from "@/lib/logger";
import { sentry } from "@/lib/sentry";
import { setAccessToken, clearAccessToken } from "@/lib/tokenManager";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      error: null,

      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        }),

      logout: () => {
        logger.info("User logged out");
        sentry.setUser(null);

        // Clear in-memory access token
        clearAccessToken();

        // Call logout endpoint to clear HttpOnly cookies
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      login: async (email: string, password: string) => {
        try {
          logger.info("Attempting login", { email });

          // Call Next.js API route (handles token storage in HttpOnly cookies)
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include", // ← CRITICAL: Send/receive cookies
            body: JSON.stringify({ email, password }),
          });

          // Parse response (handle both success and error cases)
          const result = await response.json();

          if (!response.ok) {
            // Extract error message from API response
            const errorMessage =
              result.message ||
              result.error?.message ||
              result.data?.message ||
              "Login failed";

            logger.error("Login failed", {
              status: response.status,
              message: errorMessage,
            });

            set({
              error: errorMessage,
              user: null,
              isAuthenticated: false,
            });

            throw new Error(errorMessage);
          }

          // API returns: { success, user, accessToken, expiresIn }
          const { accessToken, expiresIn, user } = result;

          if (!accessToken || !user) {
            throw new Error("Invalid response from server");
          }

          // Store user in Zustand (persisted to localStorage)
          set({
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            },
            isAuthenticated: true,
            error: null,
          });

          // Store access token in MEMORY only (XSS protection)
          setAccessToken(accessToken, expiresIn || 3600);
          logger.info("Access token stored in memory", { expiresIn });

          // ✅ Refresh token automatically stored in HttpOnly cookie by backend
          // ✅ No localStorage usage - eliminates XSS vulnerability

          logger.info("Login successful", { userId: user.id });
          sentry.setUser({ id: user.id, email: user.email });
          sentry.addBreadcrumb("User logged in", "auth");
        } catch (err: unknown) {
          const error = err as { message?: string };
          logger.error("Login failed", { error: err, email });
          set({
            error: error.message || "Login failed",
            user: null,
            isAuthenticated: false,
          });
          throw err;
        }
      },

      forgotPassword: async (email: string) => {
        try {
          set({ error: null });
          logger.info("Forgot password request", { email });

          const response = await fetch(`/api/auth/forgot-password`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            const err = await response
              .json()
              .catch(() => ({ message: "Request failed" }));
            throw new Error(err.message || "Request failed");
          }

          const result = await response.json().catch(() => ({ success: true }));

          if (!result.success) {
            throw new Error(result.message || "Failed to send reset link");
          }

          logger.info("Password reset email sent", { email });
          set({ error: null });
        } catch (err: unknown) {
          const error = err as { message?: string };
          logger.error("Forgot password failed", { error: err, email });
          set({ error: error?.message || "Failed to request password reset" });
          throw err;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }), // Only persist user, not tokens
    }
  )
);
