"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const { login, isAuthenticated, user, error } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user was redirected due to session expiration
    const expired = searchParams.get("expired");
    if (expired === "true") {
      toast.info("Session Expired", {
        description: "Your session has expired. Please log in again to continue.",
        duration: 5000,
      });
      
      // Clean up URL without triggering navigation
      window.history.replaceState({}, "", "/login");
    }

    // If user is authenticated, redirect to dashboard
    const storedUser = useAuthStore.getState().user;

    if (storedUser && isAuthenticated) {
      console.log("User already authenticated, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [router, isAuthenticated, searchParams]);

  const validateEmail = (email: string) => {
    if (!email.includes(".com")) {
      setEmailError("Email should be valid");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    console.log("Login form submitted");
    console.log("Input values:", { email, password: "***" });

    try {
      setIsLoading(true);

      // Show loading toast
      toast.loading("Signing in...", { id: "login-loading" });

      await login(email, password);

      // Dismiss loading toast
      toast.dismiss("login-loading");

      // Show success toast
      toast.success("Login successful! Redirecting...", {
        duration: 2000,
      });

      console.log("Login successful");

      // Clear form
      setEmail("");
      setPassword("");
      setRememberMe(false);

      // Redirect to dashboard after brief delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: unknown) {
      // Dismiss loading toast
      toast.dismiss("login-loading");

      // Show error toast with specific message
      if (err instanceof Error) {
        console.error("Login failed:", err.message);

        // Show user-friendly error messages
        if (err.message.includes("Super Administrator") || err.message.includes("insufficient-permissions")) {
          toast.error("Access Denied", {
            description: "This admin dashboard is only available to Super Administrators.",
            duration: 6000,
          });
        } else if (err.message.includes("verify")) {
          toast.error("Please verify your email before logging in", {
            duration: 5000,
          });
        } else if (err.message.includes("Invalid email or password")) {
          toast.error("Invalid email or password", {
            duration: 4000,
          });
        } else if (err.message.includes("Too many")) {
          toast.error("Too many login attempts. Please try again later", {
            duration: 5000,
          });
        } else if (
          err.message.includes("connect") ||
          err.message.includes("network")
        ) {
          toast.error(
            "Unable to connect to server. Please check your internet connection",
            {
              duration: 5000,
            }
          );
        } else {
          toast.error(err.message || "Login failed. Please try again", {
            duration: 4000,
          });
        }
      } else {
        console.error("Unexpected error:", err);
        toast.error("An unexpected error occurred. Please try again", {
          duration: 4000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md border border-gray-300 bg-white p-8 shadow-sm">
      <div className="flex justify-center">
        <Image src="/mash-grow-logo.png" alt="M" width={60} height={60} />
      </div>
      <h1 className="text-center text-2xl font-bold text-gray-900">
        Login to your account
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            className={`peer block w-full rounded-md border border-gray-300 bg-white px-6 pt-7 pb-5 text-gray-900 placeholder-transparent focus:border-green-700 focus:ring-0 ${
              emailError ? "border-red-500" : ""
            }`}
            placeholder=""
            suppressHydrationWarning
          />
          <label
            htmlFor="email"
            className="absolute left-4 top-0.5 -translate-y-1/2 text-gray-500 text-base transition-all 
            peer-placeholder-shown:top-1/3 peer-placeholder-shown:text-gray-400 
            peer-placeholder-shown:text-base 
            peer-focus:top-[-1] peer-focus:text-sm peer-focus:text-green-700 
            bg-white px-1"
          >
            Email
          </label>
          <div className="min-h-5">
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>
        </div>
        <div className="relative mt-6">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="peer block w-full rounded-md border border-gray-300 bg-white px-6 pt-7 pb-5 text-gray-900 placeholder-transparent focus:border-green-700 focus:ring-0"
            placeholder=""
            suppressHydrationWarning
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            suppressHydrationWarning
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
          <label
            htmlFor="password"
            className="absolute left-4 top-0.5 -translate-y-1/2 text-gray-500 text-base transition-all 
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 
            peer-placeholder-shown:text-base 
            peer-focus:top-[-1] peer-focus:text-sm peer-focus:text-green-700 
            bg-white px-1"
          >
            Password
          </label>
        </div>
        <div className="min-h-5">
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="flex items-center justify-between my-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="w-5 h-5 border border-gray-300 rounded-sm 
              data-[state=checked]:bg-green-700 
              data-[state=checked]:border-green-700"
              suppressHydrationWarning
            />
            <label htmlFor="remember" className="text-sm text-gray-700">
              Remember Me
            </label>
          </div>
          <a
            href="/forgot-password"
            className="text-sm text-teal-600 hover:underline"
          >
            Forgot Password?
          </a>
        </div>
        <Button
          type="submit"
          className="w-full bg-green-700 py-6 text-white hover:bg-green-800 flex items-center justify-center"
          disabled={isLoading || !!emailError}
          suppressHydrationWarning
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Card>
  );
}
