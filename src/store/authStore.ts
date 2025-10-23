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
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  error: string | null;
  setUser: (user: User | null, accessToken?: string, refreshToken?: string) => void;
  logout: () => void;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
}

interface LoginResponse {
  success: boolean;
  statusCode: number;
  data: {
    success: boolean;
    message: string;
    accessToken: string;
    refreshToken: string;
// <<<<<<< integration-login-api
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
// =======
//     user: User;
// >>>>>>> main
  };
  timestamp: string;
  path: string;
  correlationId: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
      setUser: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken: accessToken || null,
          refreshToken: refreshToken || null,
          isAuthenticated: !!user,
          error: null,
        }),
      logout: () => {
        // Clear cookies
        document.cookie = "authToken=; path=/; max-age=0";
        document.cookie = "refreshToken=; path=/; max-age=0";
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },
      login: async (email: string, password: string, rememberMe: boolean) => {
        try {
          console.log("Calling login API...");
          const response = await fetch(
            "https://mash-backend-api.up.railway.app/api/v1/auth/login",
            {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({ email, password }),
            }
          );

          console.log("Response status:", response.status);

          if (!response.ok) {
// <<<<<<< integration-login-api
            const data = await response.json();
            throw new Error(
              data.data?.message || data.message || "Login failed"
            );
// =======
//             const errorData = await response.json().catch(() => ({ message: "Login failed" }));
//             throw new Error(errorData.message || "Invalid credentials");
// >>>>>>> main
          }

          const result: LoginResponse = await response.json();
          console.log("Login response:", result);

// <<<<<<< integration-login-api
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
// =======
//           if (!result.success || !result.data) {
//             throw new Error(result.data?.message || "Login failed");
//           }

//           const { accessToken, refreshToken, user } = result.data;

//           // Set cookies for tokens
//           const maxAge = rememberMe ? 604800 : 86400; // 7 days if remember me, 1 day otherwise
//           document.cookie = `authToken=${accessToken}; path=/; max-age=${maxAge}; SameSite=Strict`;
//           document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${maxAge * 30}; SameSite=Strict`; // Refresh token lasts longer

//           set({
//             user,
//             accessToken,
//             refreshToken,
// >>>>>>> main
            isAuthenticated: true,
            error: null,
          });

          console.log("Login successful, user:", user);
        } catch (err) {
          console.error("Login error:", err);
          const errorMessage =
            err instanceof Error ? err.message : "An error occurred during login";
          set({ 
            error: errorMessage,
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false
          });
          throw err;
        }
      },
    }),
    {
      name: "auth-storage", // Persist auth state in localStorage
    }
  )
);
