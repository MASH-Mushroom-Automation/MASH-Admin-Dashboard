"use client"

import { useState } from "react"
import type { TabType } from "@/app/mash-market/seller/page"
import { SellerActionMenu } from "./seller-action-menu"
import { ConfirmationPopover } from "@/components/confirmation-popover"

interface Seller {
  id: string
  name: string
  storeName: string
  email: string
  status: "pending" | "approved" | "rejected"
}

const mockSellers: Seller[] = [
  {
    id: "1",
    name: "Jin Failana",
    storeName: "Smith Electronics",
    email: "john@smithelectronics.com",
    status: "pending",
  },
  {
    id: "2",
    name: "Karen Smith",
    storeName: "Smith Electronics",
    email: "john@smithelectronics.com",
    status: "approved",
  },
  {
    id: "3",
    name: "Anne Curtis",
    storeName: "Smith Electronics",
    email: "john@smithelectronics.com",
    status: "rejected",
  },
 
]

export function SellerTable({ activeTab, searchQuery }: { activeTab: TabType; searchQuery: string }) {
  const [sellers, setSellers] = useState<Seller[]>(mockSellers)
  const [confirmAction, setConfirmAction] = useState<{
    sellerId: string
    action: "reject" | "delete"
  } | null>(null)

  // Filter sellers based on tab
  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch =
      seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    switch (activeTab) {
      case "approval":
        return seller.status === "pending"
      case "approved":
        return seller.status === "approved"
      case "rejected":
        return seller.status === "rejected"
      default:
        return true
    }
  })

  const handleConfirmAction = () => {
    if (!confirmAction) return

    if (confirmAction.action === "reject") {
      setSellers((prev) => prev.map((s) => (s.id === confirmAction.sellerId ? { ...s, status: "rejected" } : s)))
    } else if (confirmAction.action === "delete") {
      setSellers((prev) => prev.filter((s) => s.id !== confirmAction.sellerId))
    }

    setConfirmAction(null)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Seller Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Store Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSellers.map((seller) => (
              <tr key={seller.id} className="border-b hover:bg-muted/30 transition-colors rounded-lg">
                <td className="px-6 py-4 text-sm text-foreground">{seller.name}</td>
                <td className="px-6 py-4 text-sm text-foreground">{seller.storeName}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{seller.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(seller.status)}`}
                  >
                    {seller.status === "pending" ? "For Approval" : seller.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <SellerActionMenu
                    seller={seller}
                    activeTab={activeTab}
                    onReject={() => setConfirmAction({ sellerId: seller.id, action: "reject" })}
                    onDelete={() => setConfirmAction({ sellerId: seller.id, action: "delete" })}
                    onAccept={() =>
                      setSellers((prev) => prev.map((s) => (s.id === seller.id ? { ...s, status: "approved" } : s)))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSellers.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-muted-foreground">No sellers found</p>
        </div>
      )}

      {/* Confirmation Popover */}
      {confirmAction && (
        <ConfirmationPopover
          action={confirmAction.action}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  )
}
