"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * FORGOT PASSWORD - STEP 1: Request Password Reset
 * ================================================
 * 
 * API Endpoint: POST http://localhost:3000/api/v1/auth/forgot-password
 * 
 * Security Features:
 * - ✅ Rate limiting: 3 requests per 5 minutes
 * - ✅ Code expires in 10 minutes
 * - ✅ Does not reveal if email exists (security best practice)
 * - ✅ Only numeric 6-digit code (mobile-friendly)
 * - ✅ 1-minute cooldown between resend requests
 * 
 * Process Flow:
 * 1. User enters their email address
 * 2. System sends 6-digit code to email
 * 3. User verifies code: POST /auth/verify-reset-code (optional)
 * 4. User resets password: POST /auth/reset-password
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "message": "A 6-digit password reset code has been sent to your email.",
 *   "expiresIn": "10 minutes",
 *   "email": "user@example.com",
 *   "nextStep": "Verify the code using POST /auth/verify-reset-code..."
 * }
 */

const LOCALHOST_API_URL = "http://localhost:3000";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailFormData = z.infer<typeof emailSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading("Sending reset code to your email...");
    
    try {
      // Call localhost backend for forgot password
      const response = await fetch(
        `${LOCALHOST_API_URL}/api/v1/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Extract error message from nested structure
        // Backend returns: { error: { message: "..." } } or { message: "..." }
        const errorMessage = 
          result.error?.message || 
          result.message || 
          result.error?.details?.message ||
          "Failed to send reset code";
        
        // Handle rate limiting (429) and other errors
        if (response.status === 429) {
          throw new Error(errorMessage || "Too many requests. Please wait a moment and try again.");
        }
        if (response.status === 400) {
          // Rate limit with countdown (e.g., "Please wait 59 seconds...")
          throw new Error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Success toast with details
      toast.success("Reset Code Sent!", {
        description: `A 6-digit code has been sent to ${data.email}. Code expires in 10 minutes.`,
        duration: 5000,
      });
      
      // Store email for next step
      sessionStorage.setItem("resetEmail", data.email);
      
      // Navigate to verification page
      router.push("/forgot-password/verify");
      
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show error toast
      toast.error("Failed to Send Code", {
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 my-[13px] flex">
      <Card className="w-full max-w-md py-10 p-10 flex">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email to receive a reset code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1 mt-[-10px]">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                disabled={isLoading}
                aria-invalid={!!errors.email}
                className="mt-3"
              />
              <div className="min-h-5">
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Sending..." : "Send Reset Code"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Remember your password?{" "}
              </span>
              <a href="/login" className="text-primary hover:underline">
                Back to login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
