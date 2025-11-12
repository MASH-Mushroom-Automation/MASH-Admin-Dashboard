"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * FORGOT PASSWORD - REDIRECT PAGE
 * ================================
 * 
 * This page redirects users to the new 3-step password reset flow.
 * The actual forgot password implementation is at /forgot-password/forgot-pass
 * 
 * Flow Structure:
 * - /forgot-password → redirects to → /forgot-password/forgot-pass (Step 1)
 * - /forgot-password/forgot-pass → Step 1: Request code (localhost:3000)
 * - /forgot-password/verify → Step 2: Verify code (localhost:3000)
 * - /forgot-password/reset → Step 3: Reset password (localhost:3000)
 * 
 * All forgot password endpoints use http://localhost:3000 (NOT production API)
 */

export default function ForgotPasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to the first step of the forgot password flow
    router.replace("/forgot-password/forgot-pass");
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
