"use client";

import Image from "next/image";
import { LoginForm } from "./login-form";

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
            <span className="text-lg font-bold text-green-600 mt-6">M.A.S.H.</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <LoginForm />
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

