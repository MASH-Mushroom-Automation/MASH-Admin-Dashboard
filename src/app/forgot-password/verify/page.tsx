"use client";

import { useState, useEffect } from "react";
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
 * FORGOT PASSWORD - STEP 2: Verify Reset Code
 * ============================================
 * 
 * API Endpoint: POST http://localhost:3000/api/v1/auth/verify-reset-code
 * 
 * Features:
 * - Optional pre-validation step (recommended for better UX)
 * - Max 5 verification attempts before code invalidation
 * - Clear error messages for expired/invalid codes
 * - Resend code functionality with 1-minute cooldown
 * - Rate limiting: 3 resend requests per 5 minutes
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "code": "123456"
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "message": "Code verified successfully",
 *   "nextStep": "Reset your password with POST /auth/reset-password"
 * }
 */

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

type OTPFormData = z.infer<typeof otpSchema>;

export default function VerifyOTPPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail");
    if (!storedEmail) {
      router.push("/forgot-password");
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });


  const onSubmit = async (data: OTPFormData) => {
    setIsLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading("Verifying your code...");
    
    try {
      // Call localhost backend for code verification (optional pre-validation)
      const response = await fetch(
        `http://localhost:3000/api/v1/auth/verify-reset-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: data.otp }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        // Extract error message from nested structure
        const errorMessage = 
          result.error?.message || 
          result.message || 
          result.error?.details?.message ||
          "Invalid or expired code";
        
        // Handle specific error cases
        if (errorMessage.includes("expired")) {
          throw new Error("Code has expired. Please request a new one.");
        }
        if (errorMessage.includes("invalid")) {
          throw new Error("Invalid code. Please check and try again.");
        }
        if (errorMessage.includes("attempts")) {
          throw new Error("Too many failed attempts. Please request a new code.");
        }
        throw new Error(errorMessage);
      }

      // Store the verified code in sessionStorage for the reset page
      sessionStorage.setItem("resetCode", data.otp);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Success toast
      toast.success("Code Verified!", {
        description: "You can now reset your password.",
        duration: 3000,
      });
      
      // Navigate to reset password page
      router.push("/forgot-password/reset");
      
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show error toast
      toast.error("Verification Failed", {
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading("Sending new code...");
    
    try {
      // Use localhost backend for resending password reset code
      const response = await fetch(
        `http://localhost:3000/api/v1/auth/resend-password-reset-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        // Extract error message from nested structure
        const errorMessage = 
          result.error?.message || 
          result.message || 
          result.error?.details?.message ||
          "Failed to resend code";
        
        // Handle rate limiting
        if (response.status === 429 || errorMessage.includes("wait")) {
          throw new Error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Success toast
      toast.success("New Code Sent!", {
        description: `A new 6-digit code has been sent to ${email}.`,
        duration: 5000,
      });
      
      // Reset countdown timer
      setTimeLeft(60);
      
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show error toast
      toast.error("Failed to Resend Code", {
        description: error instanceof Error ? error.message : "Please try again later.",
        duration: 5000,
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center my-15.5">
      <Card className="w-full max-w-md p-10">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">
                OTP Code
              </label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                maxLength={6}
                {...register("otp")}
                disabled={isLoading}
                aria-invalid={!!errors.otp}
                className="text-center text-2xl tracking-widest mt-2"
              />
              <div className="min-h-5">
                {errors.otp && (
                  <p className="text-sm text-destructive">
                    {errors.otp.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {timeLeft > 0 ? `Resend in ${timeLeft}s` : "Code expired?"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                disabled={timeLeft > 0 || resendLoading}
              >
                {resendLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Resend OTP
              </Button>
            </div>

            <div className="text-center text-sm">
              <a
                href="/forgot-password"
                className="text-primary hover:underline"
              >
                Back to email
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
