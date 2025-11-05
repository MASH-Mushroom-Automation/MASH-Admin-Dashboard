"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { forgotPassword, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setMessage(null);
      console.log("Password reset requested for:", email);
      await forgotPassword(email);
      setMessage("Password reset link sent to your email.");
      setEmail("");
    } catch (err: any) {
      console.error("Forgot password failed:", err);
      setMessage(err?.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      {/* <header className="border-b border-gray-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center">
              <Image src="/pictures/logo.png" alt="M" width={40} height={36} />
            </div>
            <span className="text-lg font-bold text-green-600 mt-6">M.A.S.H.</span>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              {message && (
                <p className="text-center text-sm text-gray-700 mt-2">
                  {message}
                </p>
              )}
              {error && !message && (
                <p className="text-center text-sm text-red-600 mt-2">{error}</p>
              )}
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-green-600 hover:underline"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      {/* <footer className="border-t border-gray-300 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-center text-sm text-gray-600">
            © 2024 M.A.S.H. All rights reserved.
          </p>
        </div>
      </footer> */}
    </div>
  );
}
