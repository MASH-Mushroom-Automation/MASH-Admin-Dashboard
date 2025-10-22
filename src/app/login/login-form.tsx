"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isAuthenticated, user, error } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("ogin form submitted");
    console.log("Input values:", { email, password, rememberMe });

    try {
      console.log("Attempting login...");
      const response = await login(email, password, rememberMe);
      console.log("Login successful:", response);

      // Clear form after success
      setEmail("");
      setPassword("");
      setRememberMe(false);

      console.log("Redirecting to /dashboard...");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.response) {
        console.error("Backend error response:", err.response.data);
      } else {
        console.error("Unexpected error:", err.message || err);
      }
    }
  };

  if (isAuthenticated && user) {
    router.push("/dashboard");
    return null;
  }

  return (
    <Card className="w-full max-w-md border border-gray-300 bg-white p-8 shadow-sm">
      <div className="flex justify-center">
        <img src="/mash-grow-logo.png" alt="M" className="w-15 h-15" />
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
            onChange={(e) => setEmail(e.target.value)}
            className="peer block w-full rounded-md border border-gray-300 bg-transparent px-6 pt-7 pb-5 text-gray-900 placeholder-transparent focus:border-green-700 focus:ring-0"
          />
          <label
            htmlFor="email"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white-500 text-base transition-all 
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 
            peer-placeholder-shown:text-base 
            peer-focus:top-[-1] peer-focus:text-sm peer-focus:text-green-700 
            bg-gray-50"
          >
            Email or Phone Number
          </label>
        </div>
        <div className="relative mt-6">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="peer block w-full rounded-md border border-gray-300 bg-transparent px-6 pt-7 pb-5 text-gray-900 placeholder-transparent focus:border-green-700 focus:ring-0"
          />
          <label
            htmlFor="password"
            className="absolute left-4 top-0.5 -translate-y-1/2 text-gray-500 text-base transition-all 
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 
            peer-placeholder-shown:text-base 
            peer-focus:top-[-1] peer-focus:text-sm peer-focus:text-green-700 
            bg-gray-50 px-1"
          >
            Password
          </label>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex items-center justify-between my-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="w-5 h-5 border border-gray-300 rounded-sm 
              data-[state=checked]:bg-green-700 
              data-[state=checked]:border-green-700"
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
          className="w-full bg-green-700 py-6 text-white hover:bg-green-800"
        >
          Login
        </Button>
      </form>
    </Card>
  );
}
