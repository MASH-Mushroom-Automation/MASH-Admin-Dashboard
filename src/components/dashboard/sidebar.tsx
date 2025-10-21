"use client"

import { useState } from "react"
import { ChevronDown, LayoutDashboard, Settings, ShoppingCart } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [managementOpen, setManagementOpen] = useState(true)
  const [activeItem, setActiveItem] = useState("Dashboard")
  const managementChildren = ["Users", "Sellers", "Orders", "Products"]
  const isManagementActive = managementChildren.includes(activeItem)

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "w-64" : "w-20"
        } bg-sidebar border-r border-sidebar-border transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Logo */}
        <div className="p-2 border-b border-sidebar-border flex items-center justify-center">
          {isOpen && (
            <Image
              src="/pictures/logo.png"
              alt="Toggle Sidebar"
              width={65}
              height={65}
              className="cursor-pointer"
              onClick={onToggle}
            />
          )}
        </div>

                                                                     {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard */}
          <NavItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            isOpen={isOpen}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />

          {/* Management Section */}
          <div>
            <button
              onClick={() => setManagementOpen(!managementOpen)}
              className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors
                ${
                  isManagementActive
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-gray-400 font-normal hover:text-gray-400 hover:bg-primary/15"
                }`}
              title={isOpen ? "" : "Management"}
            >
              <span className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                {isOpen && <span>E-commerce</span>}
              </span>
              {isOpen && (
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${managementOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>

            {/* Sub Items */}
            {managementOpen && isOpen && (
              <div className="ml-4 mt-2 space-y-1 border-l border-sidebar-border pl-4">
                {managementChildren.map((child) => (
                  <SubNavItem
                    key={child}
                    label={child}
                    activeItem={activeItem}
                    setActiveItem={setActiveItem}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <NavItem
            icon={<Settings className="w-5 h-5" />}
            label="Settings"
            isOpen={isOpen}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
              <AvatarFallback>AU</AvatarFallback>
            </Avatar>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">admin@gmail.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onToggle} />}
    </>
  )
}

function NavItem({
  icon,
  label,
  isOpen,
  activeItem,
  setActiveItem,
}: {
  icon: React.ReactNode
  label: string
  isOpen: boolean
  activeItem: string
  setActiveItem: React.Dispatch<React.SetStateAction<string>>
}) {
  const isActive = activeItem === label

  return (
    <button
      onClick={() => setActiveItem(label)}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors justify-center md:justify-start
        ${
          isActive
            ? "bg-primary/15 text-primary font-semibold"
            : "text-gray-400 font-normal hover:text-gray-400 hover:bg-primary/15"
        }`}
      title={isOpen ? "" : label}
    >
      {icon}
      {isOpen && <span>{label}</span>}
    </button>
  )
}

function SubNavItem({
  label,
  activeItem,
  setActiveItem,
}: {
  label: string
  activeItem: string
  setActiveItem: React.Dispatch<React.SetStateAction<string>>
}) {
  const isActive = activeItem === label

  return (
    <button
      onClick={() => setActiveItem(label)}
     className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors justify-center md:justify-start
        ${
          isActive
            ? "bg-primary/15 text-primary font-semibold"
            : "text-gray-400 font-normal hover:text-gray-400 hover:bg-primary/15"
        }`}
    >
      {label}
    </button>
  )
}
