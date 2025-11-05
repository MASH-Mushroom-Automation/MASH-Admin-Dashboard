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
import { Loader2, Eye, EyeOff } from "lucide-react";

const resetSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"), // Added OTP field
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
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

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
    try {
      const email = sessionStorage.getItem("resetEmail");
      if (!email) {
        throw new Error("Session expired. Please start over.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`,
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reset password");
      }

      toast.success("Password successfully reset. Redirecting to login...");
      sessionStorage.removeItem("resetEmail");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password"
      );
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
