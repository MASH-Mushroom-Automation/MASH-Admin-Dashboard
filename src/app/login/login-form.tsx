"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log("Login attempt:", { email, password, rememberMe });
  };

  return (
    <Card className="w-full max-w-md border border-gray-300 bg-white p-8 shadow-sm">
      {/* User Icon */}
      <div className="flex justify-center">
        <img src="/mash-grow-logo.png" alt="M" className="w-15 h-15" />
      </div>

      {/* Heading */}
      <h1 className=" text-center text-2xl font-bold text-gray-900">
        Login to your account
      </h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="peer block w-full rounded-md border border-gray-300 bg-transparent px-6 pt-7 pb-5 text-gray-900 placeholder-transparent focus:border-green-700 focus:ring-0"
            placeholder=""
          />
          <label
            htmlFor="email"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white-500 text-base transition-all 
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 
            peer-placeholder-shown:text-base 
            peer-focus:top-[-1] peer-focus:text-sm peer-focus:text-green-700 
             bg-gray-50  "
          >
            Email or Phone Number
          </label>
        </div>

        {/* Password Input */}
        <div className="relative mt-6">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="peer block w-full rounded-md border border-gray-300 bg-transparent px-6 pt-7 pb-5 text-gray-900 placeholder-transparent focus:border-green-700 focus:ring-0"
            placeholder=""
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

        {/* Remember Me & Forgot Password */}
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
          <a href="#" className="text-sm text-teal-600 hover:underline">
            Forgot Password?
          </a>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          className="w-full bg-green-700 py-6 text-white hover:bg-green-800"
        >
          Login
        </Button>
      </form>

      {/* Divider */}
      {/* <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-gray-300" />
        <span className="text-sm text-gray-500">or</span>
        <div className="flex-1 border-t border-gray-300" />
      </div> */}

      {/* Google Sign In */}
      {/* <Button
        type="button"
        variant="outline"
        className="w-full border border-gray-300 py-3 text-gray-900 hover:bg-gray-50 bg-transparent"
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </Button> */}
    </Card>
  );
}
