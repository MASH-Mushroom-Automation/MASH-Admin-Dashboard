// src/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { logger } from "@/lib/logger";
import { sentry } from "@/lib/sentry";

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
          
          const response = await fetch(`/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const err = await response
              .json()
              .catch(() => ({ message: "Login failed" }));
            throw new Error(err.message || "Invalid credentials");
          }

          const result = await response.json();

          if (!result.success || !result.user) {
            throw new Error("Login failed: invalid response");
          }

          // ONLY STORE USER — NO TOKENS!
          set({
            user: result.user,
            isAuthenticated: true,
            error: null,
          });

          logger.info("Login successful", { userId: result.user.id });
          sentry.setUser({ id: result.user.id, email: result.user.email });
          sentry.addBreadcrumb("User logged in", "auth");

          // DEBUG: Cookie is HttpOnly → JS cannot read it → expect "none"
          try {
            const cookie = document.cookie;
            const hasAuth = cookie.includes("authToken=");
            logger.debug("Auth cookie check", { 
              visible: hasAuth,
              expected: "HttpOnly - not visible"
            });
          } catch (err) {
            logger.warn("Cookie check failed", { error: String(err) });
          }
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
