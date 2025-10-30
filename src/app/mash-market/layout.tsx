"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import Navbar from "@/components/dashboard/navbar"


export default function MashMarketLayout({
  children,
}: {
  children: React.ReactNode
}) {

    const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      </div>
    </div>
  )
}



