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
import { Loader2, Eye, EyeOff } from "lucide-react";

/**
 * FORGOT PASSWORD - STEP 3: Reset Password
 * =========================================
 * 
 * API Endpoint: POST http://localhost:3000/api/v1/auth/reset-password
 * 
 * Features:
 * - Single-use code (code becomes invalid after successful reset)
 * - Password validation: 8+ chars, mixed case, numbers, special chars
 * - Secure password reset with 6-digit verification code
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "code": "123456",
 *   "newPassword": "SecurePass123!"
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "message": "Password has been reset successfully",
 *   "nextStep": "You can now log in with your new password"
 * }
 * 
 * Password Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  // Auto-fill the code if it was verified in the previous step
  useEffect(() => {
    const verifiedCode = sessionStorage.getItem("resetCode");
    if (verifiedCode) {
      setValue("otp", verifiedCode);
    }
  }, [setValue]);

  // Uncomment below to display password strength indicator
  // const password = watch("newPassword");
  // const getPasswordStrength = (pwd: string) => {
  //   if (!pwd) return { strength: 0, label: "", color: "" };
  //   let strength = 0;
  //   if (pwd.length >= 8) strength++;
  //   if (pwd.length >= 12) strength++;
  //   if (/[A-Z]/.test(pwd)) strength++;
  //   if (/[0-9]/.test(pwd)) strength++;
  //   if (/[^A-Za-z0-9]/.test(pwd)) strength++;
  //
  //   const levels = [
  //     { strength: 0, label: "", color: "" },
  //     { strength: 1, label: "Weak", color: "bg-destructive" },
  //     { strength: 2, label: "Fair", color: "bg-yellow-500" },
  //     { strength: 3, label: "Good", color: "bg-blue-500" },
  //     { strength: 4, label: "Strong", color: "bg-green-500" },
  //     { strength: 5, label: "Very Strong", color: "bg-green-600" },
  //   ];
  //
  //   return levels[Math.min(strength, 5)];
  // };
  // const strength = getPasswordStrength(password);

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading("Resetting your password...");
    
    try {
      const email = sessionStorage.getItem("resetEmail");
      if (!email) {
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        toast.error("Session Expired", {
          description: "Please start the password reset process again.",
          duration: 5000,
        });
        
        // Redirect to start of flow
        router.push("/forgot-password/forgot-pass");
        return;
      }

      // Call localhost backend for password reset
      const response = await fetch(
        `http://localhost:3000/api/v1/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            code: data.otp,
            newPassword: data.newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        // Handle specific error cases
        if (result.message?.includes("expired")) {
          throw new Error("Reset code has expired. Please request a new one.");
        }
        if (result.message?.includes("invalid")) {
          throw new Error("Invalid reset code. Please check and try again.");
        }
        if (result.message?.includes("password")) {
          throw new Error("Password does not meet security requirements.");
        }
        throw new Error(result.message || "Failed to reset password");
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Success toast
      toast.success("Password Reset Successful!", {
        description: "Your password has been changed. Redirecting to login...",
        duration: 3000,
      });
      
      // Clean up session storage
      sessionStorage.removeItem("resetEmail");
      sessionStorage.removeItem("resetCode");
      
      // Redirect to login after brief delay
      setTimeout(() => {
        router.push("/login");
      }, 1500);
      
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show error toast
      toast.error("Password Reset Failed", {
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center my-14">
      <Card className="w-full max-w-md p-10">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Password</CardTitle>
          <CardDescription>
            Enter a strong password to secure your account.
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

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  {...register("newPassword")}
                  disabled={isLoading}
                  aria-invalid={!!errors.newPassword}
                  className="mt-2"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="min-h-5">
                {errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                  aria-invalid={!!errors.confirmPassword}
                  className="mt-2"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="min-h-5">
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full my-4" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>

            <div className="text-center text-sm">
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
