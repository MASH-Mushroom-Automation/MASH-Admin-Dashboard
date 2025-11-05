"use client"
"use client"

import { useState } from "react"
import { useEffect } from "react"
import type { TabType } from "@/app/mash-market/seller/page"
import { SellerActionMenu } from "./seller-action-menu"
import { ConfirmationPopover } from "@/components/confirmation-popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface Seller {
  id: string
  name: string
  storeName: string
  email: string
  status: "pending" | "approved" | "rejected"
  address?: string
  username?: string
  phone?: string
  businessName?: string
  businessType?: string
}

export function SellerTable({
  sellers: mockSellers,
  activeTab,
  showStatus = true,
  mode = "default",
  onView,
  onAccept,
  onReject,
  onDelete,
}: {
  sellers: Seller[]
  activeTab: TabType
  searchQuery: string
  showStatus?: boolean
  mode?: "default" | "all" | "pending"
  onView?: (seller: Seller) => void
  onAccept?: (id: string) => void
  onReject?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const [confirmAction, setConfirmAction] = useState<{
    sellerId: string
    action: "reject" | "delete"
  } | null>(null)

  const filteredSellers = mockSellers

  const handleConfirmAction = () => {
    if (!confirmAction) return

    if (confirmAction.action === "reject") {
      if (onReject) onReject(confirmAction.sellerId)
    } else if (confirmAction.action === "delete") {
      if (onDelete) onDelete(confirmAction.sellerId)
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seller Name</TableHead>
              <TableHead>Store Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              {showStatus && <TableHead>Status</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredSellers.map((seller) => (
              <TableRow key={seller.id}>
                <TableCell>
                  {typeof onView === "function" ? (
                    <Button variant="link" onClick={() => onView(seller)} className="p-0">
                      {seller.name}
                    </Button>
                  ) : (
                    seller.name
                  )}
                </TableCell>

                <TableCell>{seller.storeName}</TableCell>
                <TableCell>{seller.email}</TableCell>
                <TableCell>{seller.address || "—"}</TableCell>

                {showStatus && (
                  <TableCell className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(
                        seller.status
                      )}`}
                    >
                      {seller.status === "pending" ? "For Approval" : seller.status}
                    </span>
                  </TableCell>
                )}

                <TableCell>
                  <SellerActionMenu
                    seller={seller}
                    activeTab={activeTab}
                    mode={mode}
                    onReject={() => setConfirmAction({ sellerId: seller.id, action: "reject" })}
                    onDelete={() => setConfirmAction({ sellerId: seller.id, action: "delete" })}
                    onAccept={() => {
                      if (onAccept) onAccept(seller.id)
                    }}
                    onView={() => {
                      if (onView) onView(seller)
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredSellers.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-muted-foreground">No sellers found</p>
        </div>
      )}

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
