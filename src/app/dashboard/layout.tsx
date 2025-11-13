"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getAccessToken, setAccessToken } from "@/lib/tokenManager";

interface Props {
  children: React.ReactNode;
}

/**
 * Client-side layout that protects all /dashboard routes.
 *
 * This checks authentication state from Zustand store (localStorage)
 * and redirects to /login if not authenticated.
 *
 * Also restores access token from refresh token on page load.
 */
export default function DashboardLayout({ children }: Props) {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isRestoringToken, setIsRestoringToken] = useState(true);

  useEffect(() => {
    const restoreToken = async () => {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        console.log("🚫 Not authenticated - redirecting to login");
        setIsRestoringToken(false);
        router.push("/login");
        return;
      }

      // Check if we already have a valid access token in memory
      const existingToken = getAccessToken();
      if (existingToken) {
        console.log("✅ Access token already in memory");
        setIsRestoringToken(false);
        return;
      }

      // No access token in memory - try to restore from refresh token
      console.log(
        "🔄 No access token in memory, attempting to restore from refresh token..."
      );

      try {
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include", // Send HttpOnly refresh cookie
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();

          // Store new access token in memory
          setAccessToken(
            refreshData.accessToken,
            refreshData.expiresIn || 3600
          );
          console.log("✅ Access token restored from refresh token");
        } else {
          const errorData = await refreshResponse.json();
          console.error(
            "❌ Failed to restore token - refresh token invalid or expired:",
            errorData
          );
          // Token refresh failed - user needs to login again
          logout();
          router.push("/login");
          return; // Don't set tokenRestored
        }
      } catch (error) {
        console.error("❌ Error restoring token:", error);
        logout();
        router.push("/login");
        return; // Don't set tokenRestored
      } finally {
        setIsRestoringToken(false);
      }
    };

    restoreToken();
  }, [isAuthenticated, user, router, logout]);

  // Show loading state while checking auth or restoring token
  if (!isAuthenticated || !user || isRestoringToken) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isRestoringToken
              ? "Restoring session..."
              : "Verifying authentication..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
