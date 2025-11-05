"use client"

import { useState } from "react"
import { PanelLeftOpen, PanelLeftClose, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  onToggleSidebar: () => void
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
    onToggleSidebar()
  }

  return (
    <nav className="h-16 bg-background border-b border-border flex items-center px-6 gap-4 p-8">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className="text-foreground hover:bg-accent"
        title="Toggle sidebar"
      >
        <span className="md:hidden">
          <Menu className="w-5 h-5" />
        </span>
        <span className="hidden md:inline-flex">
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </span>
      </Button>
    </nav>
  )
}
