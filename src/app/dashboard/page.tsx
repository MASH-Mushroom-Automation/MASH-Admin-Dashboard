"use client";

import { useState } from "react";
import Navbar from "@/components/dashboard/navbar";
import Sidebar from "@/components/sidebar";
import DashboardContent from "@/components/dashboard/dashboard-content";
import DashboardSkeleton from "@/components/dashboard/dashboar-skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardLoading } from "@/hooks/useDashboardLoading";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-fetch all endpoints on mount
  useDashboardData();

  // Detect if ANY request is in progress
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
