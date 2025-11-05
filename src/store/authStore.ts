// src/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
          console.log("Calling /api/auth/login proxy...");
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

          console.log("Login successful. HttpOnly cookies set by proxy.");

          // DEBUG: Cookie is HttpOnly → JS cannot read it → expect "none"
          try {
            const cookie = document.cookie;
            const hasAuth = cookie.includes("authToken=");
            console.log(
              "[authStore] authToken cookie visible to JS:",
              hasAuth ? "YES (not HttpOnly!)" : "none (correct – HttpOnly)"
            );
          } catch {
            console.warn("Cookie check failed");
          }
        } catch (err: unknown) {
          const error = err as { message?: string };
          console.error("Login error:", err);
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

          // success - don't change auth state, just clear error
          set({ error: null });
        } catch (err: unknown) {
          const error = err as { message?: string };
          console.error("forgotPassword error:", err);
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
