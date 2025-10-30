// components/ecommerce/seller-action-menu.tsx
"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Eye, Edit, Check, X, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ComponentType, SVGProps } from "react"
import type { TabType } from "@/app/mash-market/seller/page"

interface Seller {
  id: string
  name: string
  storeName: string
  email: string
  status: "pending" | "approved" | "rejected"
}

interface SellerActionMenuProps {
  seller: Seller
  activeTab?: TabType
  mode?: "default" | "all" | "pending"
  onReject?: () => void
  onDelete: () => void
  onAccept?: () => void
}

export function SellerActionMenu({
  seller,
  activeTab,
  mode = "default",
  onReject,
  onDelete,
  onAccept,
}: SellerActionMenuProps) {
  const router = useRouter()

  interface MenuItem {
    label: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    action: () => void
    destructive?: boolean
  }

  const getMenuItems = (): MenuItem[] => {
    const baseItems: MenuItem[] = [
      {
        label: "View",
        icon: Eye,
        action: () => router.push(`/mash-market/account-details?id=${seller.id}`),
      },
    ]

    // --- NEW MODE SYSTEM ---
    if (mode === "all") {
      return [
        ...baseItems,
        {
          label: "Delete",
          icon: Trash2,
          action: onDelete,
          destructive: true,
        },
      ]
    }

    if (mode === "pending") {

      return [
        ...baseItems,
        {
          label: "Accept",
          icon: Check,
          action: onAccept!,
        },
        {
          label: "Reject",
          icon: X,
          action: onReject!,
        },
      ]
    }

    switch (activeTab) {
      case "approval":
        return [
          ...baseItems,
          { label: "Accept", icon: Check, action: onAccept! },
          { label: "Reject", icon: X, action: onReject! },
        ]
      case "approved":
        return [
          ...baseItems,
          { label: "Edit", icon: Edit, action: () => console.log("Edit", seller.id) },
          { label: "Delete", icon: Trash2, action: onDelete, destructive: true },
        ]
      case "rejected":
        return [
          ...baseItems,
          { label: "Delete", icon: Trash2, action: onDelete, destructive: true },
        ]
      default:
        return baseItems
    }
  }

  const menuItems = getMenuItems()
  const destructiveTextClass = "text-destructive"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {menuItems.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={item.action}
            className={item.destructive ? destructiveTextClass : ""}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
