import type React from "react";
import type { Metadata } from "next";
// Temporarily commented out due to build issues - using system fonts
// import { Poppins } from "next/font/google"
import "./globals.css";
import { Toaster } from "sonner";

// const _poppins = Poppins({
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
// })

export const metadata: Metadata = {
  title: "MASH",
  description: "MASH Admin Pages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        {/* Sonner Toaster for global toast UI */}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
