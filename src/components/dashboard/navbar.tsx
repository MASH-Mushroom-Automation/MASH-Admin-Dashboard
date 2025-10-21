"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  onToggleSidebar: () => void
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  return (
    <nav className="h-16 bg-background border-b border-border flex items-center px-6 gap-4 p-8">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="text-foreground hover:bg-accent"
        title="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>
    </nav>
  )
}
