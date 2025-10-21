"use client"

import { useState } from "react"
import Navbar from "@/components/admin-view/navbar"
import Sidebar from "@/components/admin-view/sidebar"
import DashboardContent from "@/components/admin-view/dashboard-content"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

   return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <DashboardContent />
        </main>
      </div>
    </div>
  )
}
