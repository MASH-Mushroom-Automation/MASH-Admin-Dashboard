"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import DashboardContent from "@/components/dashboard/dashboard-content";
import DashboardSkeleton from "@/components/dashboard/dashboar-skeleton";
import { useDashboardStore } from "@/store/dashboardStore";
import { useDashboardLoading } from "@/hooks/useDashboardLoading";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const {
    fetchOverview,
    fetchSales,
    fetchChambers,
    fetchUsersStats,
    fetchCards,
  } = useDashboardStore();

  useEffect(() => {
    // If no user in store, verify authentication and possibly restore from cookie
    if (!user) {
      fetch("/api/auth/verify", { method: "GET", credentials: "include" })
        .then((res) => {
          if (!res.ok) {
            // Not authenticated - redirect to login
            console.log(
              "No user in store and cookie invalid - redirecting to login"
            );
            logout();
            router.push("/login");
          }
        })
        .catch(() => {
          console.log("Auth verification failed - redirecting to login");
          logout();
          router.push("/login");
        });
    }
  }, [user, logout, router]);

  useEffect(() => {
    fetchOverview();

    // -------------------------------------------------
    // SALES – keep the default 7 days
    // -------------------------------------------------
    fetchSales(7);

    // -------------------------------------------------
    // CHAMBERS – explicit page/limit + debug logs
    // -------------------------------------------------
    const page = 1;
    const limit = 10;
    console.log(`[Dashboard] fetching chambers → page=${page}, limit=${limit}`);
    fetchChambers(page, limit);

    fetchUsersStats();
    fetchCards();
  }, [fetchOverview, fetchSales, fetchChambers, fetchUsersStats, fetchCards]);
  const isLoading = useDashboardLoading();
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto bg-muted/5">
          {/* Show skeleton while loading, real content when ready */}
          {isLoading ? <DashboardSkeleton /> : <DashboardContent />}
        </main>
      </div>
    </div>
  );
}
