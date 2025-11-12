"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sprout,
  ShoppingCart,
  LogOut,
  Settings,
  ChevronDown,
  ChevronsUpDown
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationPopover } from "@/components/confirmation-popover";
import { useAuthStore } from "@/store/authStore";

export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMashMarketOpen, setIsMashMarketOpen] = useState(false);
  const [isMashGrowOpen, setIsMashGrowOpen] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/mash-market")) setIsMashMarketOpen(true);
    if (pathname?.startsWith("/mash-grow")) setIsMashGrowOpen(true);
  }, [pathname]);

  const getUserInitials = () => {
    if (!user?.firstName || !user?.lastName) return "AU";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const getUserDisplayName = () =>
    user ? `${user.firstName} ${user.lastName}` : "Admin User";

  const mashMarketItems = [
    { label: "Users", href: "/mash-market/user" },
    { label: "Sellers", href: "/mash-market/seller" },
    { label: "Orders", href: "/mash-market/order" },
    { label: "Products", href: "/mash-market/product" },
  ];

  const mashGrowItems = [
    { label: "Devices", href: "/mash-grow/devices" },
    { label: "Registered Users", href: "/mash-grow/registered-users" },
  ];

  return (
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex items-center justify-center border-b border-sidebar-border p-2">
          <Image
            src="/pictures/logo.png"
            alt="Logo"
            width={48}
            height={48}
            className="cursor-pointer transition-all"
          />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Dashboard */}
                <SidebarMenuItem>
                  <Link href="/dashboard" legacyBehavior>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/dashboard"}
                      tooltip="Dashboard"
                    >
                      <a>
                        <LayoutDashboard />
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>

                {/* MashMarket */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsMashMarketOpen((p) => !p)}
                    isActive={pathname?.startsWith("/mash-market")}
                    tooltip="MashMarket"
                  >
                    <ShoppingCart />
                    <span>MashMarket</span>
                    <ChevronDown
                      className={`ml-auto transition-transform ${
                        isMashMarketOpen ? "rotate-180" : ""
                      }`}
                    />
                  </SidebarMenuButton>

                  {isMashMarketOpen && (
                    <SidebarMenuSub>
                      {mashMarketItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          {/* Use legacyBehavior + asChild to avoid nested anchors */}
                          <Link href={item.href} legacyBehavior>
                            <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                              <a>{item.label}</a>
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>

                {/* MashGrow */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsMashGrowOpen((p) => !p)}
                    isActive={pathname?.startsWith("/mash-grow")}
                    tooltip="MashGrow"
                  >
                    <Sprout />
                    <span>MashGrow</span>
                    <ChevronDown
                      className={`ml-auto transition-transform ${
                        isMashGrowOpen ? "rotate-180" : ""
                      }`}
                    />
                  </SidebarMenuButton>

                  {isMashGrowOpen && (
                    <SidebarMenuSub>
                      {mashGrowItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <Link href={item.href} legacyBehavior>
                            <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                              <a>{item.label}</a>
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />

       <SidebarFooter>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="flex items-center w-full gap-3 rounded-md p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
        <Avatar className="w-5 h-5">
          <AvatarFallback>{getUserInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium truncate">
            {getUserDisplayName()}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.email ?? "admin@gmail.com"}
          </p>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="start" className="w-48 p-1">
      <DropdownMenuItem asChild>
        <Link href="/settings" legacyBehavior>
          <a className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-muted/5">
            <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm">Settings</span>
          </a>
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-muted/5 text-destructive"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-sm">Logout</span>
        </button>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {showLogoutConfirm && (
    <ConfirmationPopover
      action="logout"
      onCancel={() => setShowLogoutConfirm(false)}
      onConfirm={async () => {
        setShowLogoutConfirm(false)
        logout()
        router.push("/login")
      }}
    />
  )}
</SidebarFooter>
      </Sidebar>
  );
}
