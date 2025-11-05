"use client"

import type { Product } from "@/app/mash-market/product/page"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Eye, Check, X, Archive } from "lucide-react"

interface ProductTableProps {
  products: Product[]
  onViewDetails: (product: Product) => void
  onApprove: (product: Product) => void
  onReject: (product: Product) => void
  onArchive?: (product: Product) => void
  showApproveReject?: boolean
}

export function ProductTable({
  products,
  onViewDetails,
  onApprove,
  onReject,
  onArchive,
  showApproveReject = true,
}: ProductTableProps) {
  const formatPrice = (price: number) => `$${price.toFixed(2)}`

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="overflow-x-auto">
          <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Product</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Seller</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Price</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
            {showApproveReject && (
              <>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date Submitted</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
              </>
            )}
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="rounded object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{product.name}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground">{product.seller}</td>
              <td className="px-6 py-4 text-sm font-medium text-foreground">{formatPrice(product.price)}</td>
              <td className="px-6 py-4 text-sm text-muted-foreground">{product.category}</td>
              {showApproveReject && (
                <>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {product.submittedAt ? formatDate(product.submittedAt) : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </td>
                </>
              )}
              <td className="px-6 py-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(product)} className="cursor-pointer">
                      <Eye className="mr-2 h-4 w-4" />
                      <span>View Details</span>
                    </DropdownMenuItem>
                    {showApproveReject && product.status === "pending" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onApprove(product)} className="cursor-pointer text-green-600">
                          <Check className="mr-2 h-4 w-4" />
                          <span>Approve</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onReject(product)} className="cursor-pointer text-red-600">
                          <X className="mr-2 h-4 w-4" />
                          <span>Reject</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {!showApproveReject && onArchive && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onArchive(product)} className="cursor-pointer text-orange-600">
                          <Archive className="mr-2 h-4 w-4" />
                          <span>Archive</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found</p>
        </div>
      )}
    </div>
  )
}
