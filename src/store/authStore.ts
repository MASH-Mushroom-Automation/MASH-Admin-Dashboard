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
  success: boolean;
  statusCode: number;
  data: {
    success: boolean;
    message: string;
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  timestamp: string;
  path: string;
  correlationId: string;
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
            throw new Error(
              data.data?.message || data.message || "Login failed"
            );
          }

          const data: LoginResponse = await response.json();

          // Validate the response structure
          if (!data.data?.user?.email || !data.data?.accessToken) {
            throw new Error(
              "Invalid API response: Missing email or accessToken"
            );
          }

          // Set the authToken cookie
          document.cookie = `authToken=${data.data.accessToken}; path=/; ${
            rememberMe ? "max-age=604800" : ""
          }`;

          set({
            user: { email: data.data.user.email, token: data.data.accessToken },
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
