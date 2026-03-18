"use client"
"use client"

import { useState } from "react"
import type { TabType } from "@/app/mash-market/seller/page"
import { SellerActionMenu } from "./seller-action-menu"
import { ConfirmationPopover } from "@/components/confirmation-popover"
import RejectReasonModal from "@/components/ecommerce/reject-reason-modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface Seller {
  id: string
  name: string
  storeName: string
  email: string
  status: "pending" | "approved" | "rejected"
  rejectReason?: string
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
  onArchive,
}: {
  sellers: Seller[]
  activeTab: TabType
  searchQuery: string
  showStatus?: boolean
  mode?: "default" | "all" | "pending"
  onView?: (seller: Seller) => void
  onAccept?: (id: string) => void
  onReject?: (id: string, reason?: string) => void
  onArchive?: (id: string) => void
}) {
  const [confirmAction, setConfirmAction] = useState<{
    sellerId: string
    action: "reject" | "Archive" | "accept"
  } | null>(null)

  const filteredSellers = mockSellers

  const handleConfirmAction = (reason?: string) => {
    if (!confirmAction) return

    if (confirmAction.action === "reject") {
      if (onReject) onReject(confirmAction.sellerId, reason)
    } else if (confirmAction.action === "Archive") {
      if (onArchive) onArchive(confirmAction.sellerId)
    } else if (confirmAction.action === "accept") {
      if (onAccept) onAccept(confirmAction.sellerId)
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
        {activeTab === "rejected" && <TableHead>Reason</TableHead>}
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

                {activeTab === "rejected" && (
                  <TableCell className="px-6 py-4 text-sm">{seller.rejectReason ?? "—"}</TableCell>
                )}

                <TableCell>
                  <SellerActionMenu
                    seller={seller}
                    activeTab={activeTab}
                    // show pending actions when in pending tab
                    mode={activeTab === "pending" ? "pending" : mode}
                    onReject={() => setConfirmAction({ sellerId: seller.id, action: "reject" })}
                    onArchive={() => setConfirmAction({ sellerId: seller.id, action: "Archive" })}
                    onAccept={() => setConfirmAction({ sellerId: seller.id, action: "accept" })}
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

      {confirmAction && confirmAction.action === "reject" ? (
        <RejectReasonModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setConfirmAction(null)
          }}
          onConfirm={(reason) => handleConfirmAction(reason)}
        />
      ) : confirmAction ? (
        <ConfirmationPopover
          action={confirmAction.action}
          onConfirm={(reason) => handleConfirmAction(reason)}
          onCancel={() => setConfirmAction(null)}
        />
      ) : null}
    </>
  )
}

