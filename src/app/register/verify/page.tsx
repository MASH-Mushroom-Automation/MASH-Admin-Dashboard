"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { setAccessToken } from "@/lib/tokenManager";
import { useAuthStore } from "@/store/authStore";

const verifyCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Verification code must be exactly 6 digits"),
});

type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
  });

  useEffect(() => {
    // Get email from sessionStorage
    const storedEmail = sessionStorage.getItem("registerEmail");
    if (!storedEmail) {
      toast.error("No registration email found. Please register again.");
      router.push("/register");
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const onSubmit = async (data: VerifyCodeFormData) => {
    if (!email) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-email-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: data.code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Verification failed");
      }

      // Store access token in memory (via tokenManager)
      if (result.token) {
        // Backend returns JWT token with expiresIn (default 3600 seconds = 1 hour)
        setAccessToken(result.token, 3600);
      }

      // Store user in auth store
      if (result.user) {
        setUser(result.user);
      }

      // Clear email from sessionStorage
      sessionStorage.removeItem("registerEmail");

      toast.success("Email verified successfully! You are now logged in.");

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email || cooldownSeconds > 0) return;

    setIsResending(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/resend-verification-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to resend code");
      }

      toast.success("Verification code sent! Check your email.");
      setCooldownSeconds(60); // 1-minute cooldown
    } catch (error) {
      console.error("Resend error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
          <CardDescription>
            We sent a 6-digit verification code to
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                className="text-center text-2xl tracking-widest"
                {...register("code")}
                disabled={isLoading}
                autoFocus
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Code expires in 10 minutes
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Didn&apos;t receive the code?
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendCode}
              disabled={isResending || cooldownSeconds > 0}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : cooldownSeconds > 0 ? (
                `Resend code in ${cooldownSeconds}s`
              ) : (
                "Resend verification code"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Wrong email?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Register again
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
