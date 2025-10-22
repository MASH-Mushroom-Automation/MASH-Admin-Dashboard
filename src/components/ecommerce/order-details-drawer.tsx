"use client"

import type { OrderLog } from "./content/orders-content"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface OrderDetailsDrawerProps {
  order: OrderLog
  isOpen: boolean
  onClose: () => void
}

const statusConfig = {
  "pending-payment": {
    label: "Pending Payment",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  shipment: {
    label: "Shipment",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  "failed-delivery": {
    label: "Failed Delivery",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  "refund-return": {
    label: "Refund / Return",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  canceled: {
    label: "Canceled",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
  dispute: {
    label: "Dispute",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
  "payment-verification": {
    label: "Payment Verification",
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  },
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
              <Badge className={statusConfig[order.status].color}>{statusConfig[order.status].label}</Badge>
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
