"use client";

import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Footer } from "./footer";

function LoginFormWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="border-b border-gray-300 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center">
              <Image src="/pictures/logo.png" alt="M" width={40} height={36} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <LoginFormWrapper />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
