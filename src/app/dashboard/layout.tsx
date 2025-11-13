"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface Props {
  children: React.ReactNode;
}

/**
 * Client-side layout that protects all /dashboard routes.
 *
 * This checks authentication state from Zustand store (localStorage)
 * and redirects to /login if not authenticated.
 */
export default function DashboardLayout({ children }: Props) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      console.log("🚫 Not authenticated - redirecting to login");
      router.push("/login");
    } else {
      console.log("✅ User authenticated:", user.email);
    }
  }, [isAuthenticated, user, router]);

  // Show loading state while checking auth
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
