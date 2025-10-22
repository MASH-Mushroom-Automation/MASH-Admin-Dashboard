"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For now, just redirect to dashboard
    // You can add authentication logic here later
    console.log("Login attempt:", { email, password, rememberMe });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="border-b border-gray-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center">
              <Image src="/pictures/logo.png" alt="M" width={40} height={36} />
            </div>
            <span className="text-lg font-bold text-green-600 mt-6">M.A.S.H.</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border border-gray-300 bg-white p-8 shadow-sm">
          <div className="flex justify-center mb-4">
            <Image src="/mash-grow-logo.png" alt="M" width={60} height={60} />
          </div>
          <h1 className="text-center text-2xl font-bold text-gray-900 mb-6">
            Login to your account
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full"
              />
            </div>

            <div className="relative">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              Login
            </Button>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-300 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-center text-sm text-gray-600">
            © 2024 M.A.S.H. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
