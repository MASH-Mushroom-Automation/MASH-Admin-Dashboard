"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/sidebar";
import DashboardContent from "@/components/dashboard/dashboard-content";
import DashboardSkeleton from "@/components/dashboard/dashboar-skeleton";
import { useDashboardStore } from "@/store/dashboardStore";
import { useUserManagementStore } from "@/store/userManagementStore";
import { useDashboardLoading } from "@/hooks/useDashboardLoading";
import { useAuthStore } from "@/store/authStore";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [forceShowContent, setForceShowContent] = useState(false);
  const { user } = useAuthStore();

  // Subscribe to the entire store to ensure re-renders
  const {
    fetchOverview,
    fetchSales,
    fetchChambers,
    fetchUsersStats,
    fetchCards,
  } = useDashboardStore();

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
    // Wait for token restoration before fetching data
    const fetchData = async () => {
      if (!user) {
        console.log("[Dashboard] ⏸️ Waiting for user authentication...");
        return;
      }

      // Check if token is available
      const { getAccessToken } = await import("@/lib/tokenManager");
      const token = getAccessToken();

      if (!token) {
        console.log(
          "[Dashboard] ⏸️ No access token yet - waiting for restoration..."
        );
        return;
      }

      console.log("✅ Dashboard loaded for user:", user.email);
      console.log("✅ Access token available - fetching dashboard data...");

      fetchOverview();
      fetchSales(7);

      const page = 1;
      const limit = 10;
      console.log(
        `[Dashboard] fetching chambers → page=${page}, limit=${limit}`
      );
      fetchChambers(page, limit);

      fetchUsersStats();
      fetchCards();

      // Fetch users for chamber-inventory component user table
      fetchUsers(1, 10);
    };

    // Small delay to ensure layout has finished token restoration
    const timer = setTimeout(fetchData, 100);
    return () => clearTimeout(timer);
  }, [
    user,
    fetchOverview,
    fetchSales,
    fetchChambers,
    fetchUsersStats,
    fetchCards,
    fetchUsers,
  ]);
  const isLoading = useDashboardLoading();
  const { loading } = useDashboardStore();

  // Debug: Log loading states
  useEffect(() => {
    console.log("[Dashboard] Loading states:", loading);
    console.log("[Dashboard] isLoading:", isLoading);
  }, [loading, isLoading]);

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
