// layout.tsx
"use client"

import React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import AppSidebar from "@/components/sidebar"
import Navbar from "@/components/navbar"

export default function Layout({ children }: { children: React.ReactNode }) {
  // Sidebar open state is managed by the SidebarProvider; remove local state
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        {/* Sidebar always visible */}
        <AppSidebar />

        {/* Main page content area: keep the page exact to viewport and let the inset scroll */}
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <Navbar />

          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
