"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, LayoutDashboard, Sprout, ShoppingCart, LogOut, Settings, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ConfirmationPopover } from "@/components/confirmation-popover"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter()
  const [isMashMarketOpen, setIsMashMarketOpen] = useState(false)
  const [isMashGrowOpen, setIsMashGrowOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // lock body scroll when sidebar is open on small screens (mobile)
    const handle = () => {
      if (typeof window === "undefined") return
      if (isOpen && window.innerWidth < 768) {
        document.body.style.overflow = "hidden"
      } else {
        document.body.style.overflow = ""
      }
    }

    handle()
    window.addEventListener("resize", handle)
    return () => {
      window.removeEventListener("resize", handle)
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    if (pathname.startsWith("/mash-market")) setIsMashMarketOpen(true)
    if (pathname.startsWith("/mash-grow")) setIsMashGrowOpen(true)
  }, [pathname])

  const mashMarketChildren = ["User", "Seller", "Order", "Product", "CMS"]
  const mashGrowChildren = ["devices", "registered-users", "cms"]

  const isMashMarketActive = mashMarketChildren.some((child) =>
    pathname.startsWith(`/mash-market/${child.toLowerCase()}`)
  )
  const isMashGrowActive = mashGrowChildren.some((child) => pathname.startsWith(`/mash-grow/${child}`))

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`bg-sidebar border-r border-sidebar-border overflow-y-auto flex flex-col min-h-screen h-screen md:h-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${isOpen ? "w-64 md:w-64" : "w-20 md:w-20"}
          fixed md:static top-0 bottom-0 left-0 z-50 md:z-auto`}
      >
        {/* Mobile close button */}
        <div className="md:hidden flex items-center justify-end p-2">
          {isOpen && (
            <button
              aria-label="Close sidebar"
              onClick={onToggle}
              className="p-2 rounded-md hover:bg-accent/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-2 border-b border-sidebar-border flex items-center justify-center">
          <Image
            src="/pictures/logo.png"
            alt="Logo"
            width={isOpen ? 65 : 32}
            height={isOpen ? 65 : 32}
            className={`cursor-pointer transition-all duration-300 ${isOpen ? "" : "py-3"}`}
            onClick={onToggle}
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          
          {/* Dashboard */}
          <NavItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
            href="/dashboard"
            isOpen={isOpen}
            pathname={pathname}
          />

          {/* MashMarket Section */}
          <CollapsibleSection
            title="MashMarket"
            icon={<ShoppingCart className="w-5 h-5" />}
            isOpen={isOpen}
            isActive={isMashMarketActive}
            isExpanded={isMashMarketOpen}
            onToggle={() => setIsMashMarketOpen((prev) => !prev)}
          >
            <SubNavItem label="Users" href="/mash-market/user" pathname={pathname} />
            <SubNavItem label="Sellers" href="/mash-market/seller" pathname={pathname} />
            <SubNavItem label="Orders" href="/mash-market/order" pathname={pathname} />
            <SubNavItem label="Products" href="/mash-market/product" pathname={pathname} />
            <SubNavItem label="CMS" href="/mash-market/cms" pathname={pathname} />
          </CollapsibleSection>

          {/* MashGrow Section */}
          <CollapsibleSection
            title="MashGrow"
            icon={<Sprout className="w-5 h-5" />}
            isOpen={isOpen}
            isActive={isMashGrowActive}
            isExpanded={isMashGrowOpen}
            onToggle={() => setIsMashGrowOpen((prev) => !prev)}
          >
            <SubNavItem label="Devices" href="/mash-grow/devices" pathname={pathname} />
            <SubNavItem label="Registered Users" href="/mash-grow/registered-users" pathname={pathname} />
            <SubNavItem label="CMS" href="/mash-grow/cms" pathname={pathname} />
          </CollapsibleSection>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>AU</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-40">
                {/* Link to settings page for super-admin */}
                <DropdownMenuItem asChild className="flex items-center gap-2">
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex items-center gap-2 text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">admin@gmail.com</p>
              </div>
            )}
          </div>
        </div>

        {showLogoutConfirm && (
          <ConfirmationPopover
            action="logout"
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={() => {
              setShowLogoutConfirm(false)
              // simple client-side redirect; adapt to your auth flow as needed
              router.push("/login")
            }}
          />
        )}
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onToggle} />}
    </>
  )
}

/* -------------------- Collapsible Section -------------------- */
function CollapsibleSection({
  title,
  icon,
  isOpen,
  isActive,
  isExpanded,
  onToggle,
  children,
}: {
  title: string
  icon: React.ReactNode
  isOpen: boolean
  isActive: boolean
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors
          ${
            isActive
              ? "bg-primary/15 text-primary font-semibold"
              : "text-gray-400 font-normal hover:text-gray-400 hover:bg-primary/15"
          }`}
        title={isOpen ? "" : title}
      >
        <span className="flex items-center gap-3">
          {icon}
          {isOpen && <span>{title}</span>}
        </span>
        {isOpen && (
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {isExpanded && isOpen && (
        <div className="ml-4 mt-2 space-y-1 border-l border-sidebar-border pl-4">
          {children}
        </div>
      )}
    </div>
  )
}

/* -------------------- NavItem -------------------- */
function NavItem({
  icon,
  label,
  href,
  isOpen,
  pathname,
}: {
  icon: React.ReactNode
  label: string
  href: string
  isOpen: boolean
  pathname: string
}) {
  const isActive = pathname === href

  return (
    <Link
      href={href}
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
    </Link>
  )
}

/* -------------------- SubNavItem -------------------- */
function SubNavItem({
  label,
  href,
  pathname,
}: {
  label: string
  href: string
  pathname: string
}) {
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors justify-center md:justify-start
        ${
          isActive
            ? "bg-primary/15 text-primary font-semibold"
            : "text-gray-400 font-normal hover:text-gray-400 hover:bg-primary/15"
        }`}
    >
      {label}
    </Link>
  )
}
