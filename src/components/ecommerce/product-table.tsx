"use client"

import type { Product } from "@/app/mash-market/product/page"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ActionsMenu } from "@/components/user-actions-menu"
import { Check, X, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <Table className="min-w-full text-sm sm:text-base">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Category</TableHead>
            {showApproveReject && (
              <>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Status</TableHead>
              </>
            )}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <p className="font-medium truncate">{product.name}</p>
                </div>
              </TableCell>
              <TableCell>{product.seller}</TableCell>
              <TableCell>{formatPrice(product.price)}</TableCell>
              <TableCell className="truncate">{product.category}</TableCell>

              {showApproveReject && (
                <>
                  <TableCell>{product.submittedAt ? formatDate(product.submittedAt) : "N/A"}</TableCell>
                  <TableCell className="capitalize">
                    {product.status === "pending" && (
                      <span className="text-yellow-600 font-medium">Pending</span>
                    )}
                    {product.status === "approved" && (
                      <span className="text-green-600 font-medium">Approved</span>
                    )}
                    {product.status === "rejected" && (
                      <span className="text-red-600 font-medium">Rejected</span>
                    )}
                  </TableCell>
                </>
              )}

              {/* ✅ ActionsMenu integrated here */}
              <TableCell>
                {showApproveReject && product.status === "pending" ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApprove(product)}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReject(product)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                ) : (
                  <ActionsMenu
                    id={product.id}
                    viewUrl={`/mash-market/product/${product.id}`}
                    onDelete={() => onArchive?.(product)}
                    showView={true}
                    showEdit={false}
                    deleteLabel={onArchive ? "Archive" : "Delete"}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {products.length === 0 && (
        <div className="text-center text-muted-foreground py-6">
          No products found
        </div>
      )}
    </div>
  )
}
