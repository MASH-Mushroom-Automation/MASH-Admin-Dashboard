"use client"

import { useState } from "react"
import { useEffect } from "react"
import type { TabType } from "@/app/mash-market/seller/page"
import { SellerActionMenu } from "./seller-action-menu"
import { ConfirmationPopover } from "@/components/confirmation-popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Seller {
  id: string
  name: string
  storeName: string
  email: string
  status: "pending" | "approved" | "rejected"
  address?: string
}

export function SellerTable({
  sellers: mockSellers,
  activeTab,
  showStatus = true,
  mode = "default",
}: {
  sellers: Seller[]
  activeTab: TabType
  searchQuery: string
  showStatus?: boolean
  mode?: "default" | "all" | "pending"
}) {
 
  const [sellers, setSellers] = useState<Seller[]>(mockSellers)

  useEffect(() => {
    setSellers(mockSellers)
  }, [mockSellers])
  const [confirmAction, setConfirmAction] = useState<{
    sellerId: string
    action: "reject" | "delete"
  } | null>(null)

 const filteredSellers = sellers

  const handleConfirmAction = () => {
    if (!confirmAction) return

    if (confirmAction.action === "reject") {
      setSellers((prev) =>
        prev.map((s) =>
          s.id === confirmAction.sellerId ? { ...s, status: "rejected" } : s
        )
      )
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seller Name</TableHead>
              <TableHead>Store Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              {showStatus && (
                <TableHead>Status</TableHead>
              )}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSellers.map((seller) => (
              <TableRow
                key={seller.id}
              >
                <TableCell>{seller.name}</TableCell>
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
                    onReject={() =>
                      setConfirmAction({ sellerId: seller.id, action: "reject" })
                    }
                    onDelete={() =>
                      setConfirmAction({ sellerId: seller.id, action: "delete" })
                    }
                    onAccept={() =>
                      setSellers((prev) =>
                        prev.map((s) =>
                          s.id === seller.id ? { ...s, status: "approved" } : s
                        )
                      )
                    }
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
