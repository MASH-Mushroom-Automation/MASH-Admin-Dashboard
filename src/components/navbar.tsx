"use client"

import { PanelLeftOpen, PanelLeftClose, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

interface NavbarProps {
  onToggleSidebar?: () => void
}

export default function Navbar({}: NavbarProps) {
  const { toggleSidebar, state } = useSidebar()

  return (
    <div className="h-[53px] bg-background border-b border-border flex items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => toggleSidebar()}
        className="text-foreground hover:bg-accent p-3"
        title="Toggle sidebar"
      >
        <span className="md:hidden">
          <Menu className="w-5 h-5" />
        </span>
        <span className="hidden md:inline-flex ml-9">
          {state === "expanded" ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </span>
      </Button>
    </div>
  )
}
