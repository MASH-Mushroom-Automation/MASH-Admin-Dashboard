import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: { email: string; token: string } | null;
  isAuthenticated: boolean;
  error: string | null;
  setUser: (user: { email: string; token: string } | null) => void;
  logout: () => void;
  login: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => Promise<void>;
}

interface LoginResponse {
  message: string;
  token: string;
  user: { email: string };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      error: null,
      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
      logout: () => set({ user: null, isAuthenticated: false, error: null }),
      login: async (email: string, password: string, rememberMe: boolean) => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Login failed");
          }

          const data: LoginResponse = await response.json();

          // Set the authToken cookie
          document.cookie = `authToken=${data.token}; path=/; ${
            rememberMe ? "max-age=604800" : "" // 7 days if rememberMe is true
          }`;

          set({
            user: { email: data.user.email, token: data.token },
            isAuthenticated: true,
            error: null,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "An error occurred";
          set({ error: errorMessage });
          throw err;
        }
      },
    }),
    {
      name: "auth-storage", // Persist auth state in localStorage
    }
  )
);
