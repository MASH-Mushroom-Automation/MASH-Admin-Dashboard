"use client"

import type { Product } from "@/app/mash-market/product/page"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import Image from "next/image"

interface ProductDetailsModalProps {
  product: Product
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  showActions?: boolean
}

export function ProductDetailsModal({
  product,
  onClose,
  onApprove,
  onReject,
  showActions = false,
}: ProductDetailsModalProps) {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Product Details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Image */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="rounded-lg object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-muted-foreground">Product Name</label>
              <p className="text-lg font-medium text-foreground mt-1">{product.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Seller</label>
                <p className="text-foreground mt-1">{product.seller}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Category</label>
                <p className="text-foreground mt-1">{product.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Price</label>
                <p className="text-lg font-bold text-foreground mt-1">{formatPrice(product.price)}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Submitted</label>
                <p className="text-foreground mt-1">{formatDate(product.submittedAt)}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground">Description</label>
              <p className="text-foreground mt-2 leading-relaxed">{product.description}</p>
            </div>
          </div>

          {/* Actions */}
          {showActions && product.status === "pending" && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button variant="destructive" onClick={onReject} className="flex-1">
                Reject
              </Button>
              <Button onClick={onApprove} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Approve
              </Button>
            </div>
          )}

          {(!showActions || product.status !== "pending") && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose} className="w-full bg-transparent">
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
