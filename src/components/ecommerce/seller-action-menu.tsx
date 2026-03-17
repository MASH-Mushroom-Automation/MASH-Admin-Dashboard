"use client";

import { Button } from "@/components/ui/button";
import { Eye, Check, X, Trash2, Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import type { TabType } from "@/app/mash-market/seller/page";

interface Seller {
  id: string;
  name: string;
  storeName: string;
  email: string;
  status: "pending" | "approved" | "rejected";
}

interface SellerActionMenuProps {
  seller: Seller;
  activeTab?: TabType | string;
  mode?: "default" | "all" | "pending";
  onReject?: () => void;
  onArchive: () => void;
  onAccept?: () => void;
  onView?: () => void;
}

export function SellerActionMenu({
  seller,
  activeTab,
  mode = "default",
  onReject,
  onArchive,
  onAccept,
  onView,
}: SellerActionMenuProps) {
  const router = useRouter();

  interface MenuItem {
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    action: () => void;
    destructive?: boolean;
  }

  const getMenuItems = (): MenuItem[] => {
    const baseItems: MenuItem[] = [
      {
        label: "View",
        icon: Eye,
        action: () => {
          if (onView) return onView();
          // Navigate to the seller detail page instead of an account-details modal
          return router.push(`/mash-market/seller/${seller.id}`);
        },
      },
    ];

    // --- NEW MODE SYSTEM ---
    if (mode === "all") {
      return [
        ...baseItems,
        {
          label: "Archive",
          icon: Trash2,
          action: onArchive,
          destructive: true,
        },
      ];
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
      ];
    }

    switch (activeTab) {
      case "approval":
        return [
          ...baseItems,
          { label: "Accept", icon: Check, action: onAccept! },
          { label: "Reject", icon: X, action: onReject! },
        ];
      case "approved":
        return baseItems;
      case "rejected":
        return [
          ...baseItems,
          {
            label: "Archive",
            icon: Archive,
            action: onArchive,
            destructive: true,
          },
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex items-center gap-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.label}
            variant="ghost"
            size="icon"
            className={
              item.destructive ? `h-8 w-8 text-destructive p-0` : `h-8 w-8 p-0`
            }
            onClick={item.action}
            aria-label={item.label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
