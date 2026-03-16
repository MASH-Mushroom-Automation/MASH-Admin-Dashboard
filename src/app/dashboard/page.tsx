"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/sidebar";
import DashboardContent from "@/components/dashboard/dashboard-content";
import DashboardSkeleton from "@/components/dashboard/dashboar-skeleton";
import { useUserManagementStore } from "@/store/userManagementStore";
import { useDashboardLoading } from "@/hooks/useDashboardLoading";
import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [forceShowContent, setForceShowContent] = useState(false);
  const { user } = useAuthStore();

  const { fetchUsers } = useUserManagementStore();

  // Safety: Force show content after 5 seconds even if loading states are stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("[Dashboard] ⏰ 5 second timeout - forcing content display");
      setForceShowContent(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch users for chamber-inventory component user table (Wait until TanStack covers users too)
    fetchUsers(1, 10);
  }, [fetchUsers]);

  const isLoading = useDashboardLoading();

  // Debug: Log loading states
  useEffect(() => {
    console.log("[Dashboard] isLoading:", isLoading);
  }, [isLoading]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        {/* Sidebar: responsive wrapper */}
        <div
          className={`fixed inset-y-0 left-0 z-40 bg-background transition-[left] duration-300 ease-in-out md:relative md:left-0
          ${sidebarOpen ? "left-0" : "-left-full"}`}
        >
          <AppSidebar />
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-auto bg-muted/5">
            {isLoading && !forceShowContent ? (
              <DashboardSkeleton />
            ) : (
              <DashboardContent />
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
