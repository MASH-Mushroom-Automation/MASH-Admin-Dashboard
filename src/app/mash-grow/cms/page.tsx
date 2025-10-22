"use client"

import { useState } from "react"
import Navbar from "@/components/dashboard/navbar"
import Sidebar from "@/components/sidebar"
import RegisterChamber from "@/components/mash-grow/register-content"
import CmsContent from "@/components/mash-grow/cms-content"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

   return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <CmsContent />
        </main>
      </div>
    </div>
  )
}
