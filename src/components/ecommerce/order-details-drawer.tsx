"use client"

import type { OrderLog } from "@/app/mash-market/order/page"
import { X } from "lucide-react"
import StatusBadge from "@/components/status-badge"

interface OrderDetailsDrawerProps {
  order: OrderLog
  isOpen: boolean
  onClose: () => void
}


export function OrderDetailsDrawer({ order, isOpen, onClose }: OrderDetailsDrawerProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-background shadow-lg transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="sticky top-0 border-b border-border bg-background p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Order Details</h2>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted" aria-label="Close drawer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Order ID */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Order ID</p>
            <p className="mt-1 text-lg font-medium text-foreground">{order.orderId}</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Seller Information */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Seller Name</p>
            <p className="mt-1 text-foreground">{order.sellerName}</p>
          </div>

          {/* Buyer Details */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Buyer Name</p>
            <p className="mt-1 text-foreground">{order.buyerName}</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Payment Method */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Payment Method</p>
            <p className="mt-1 text-foreground">{order.paymentMethod || "Not specified"}</p>
          </div>

          {/* Order Date */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Date Ordered</p>
            <p className="mt-1 text-foreground">{order.orderDate}</p>
          </div>

          {/* Amount */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Amount</p>
            <p className="mt-1 text-lg font-semibold text-foreground">${order.amount.toFixed(2)}</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Current Status */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Current Status</p>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={order.status} />
              <span className="text-sm text-muted-foreground">{order.lastUpdated}</span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Notes</p>
              <p className="mt-2 rounded-lg bg-muted p-3 text-sm text-foreground">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}